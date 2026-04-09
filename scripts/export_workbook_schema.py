from __future__ import annotations

import json
import re
import sys
import zipfile
from collections import OrderedDict
from pathlib import Path
from typing import Any
from xml.etree import ElementTree as ET


NS = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
    "rel": "http://schemas.openxmlformats.org/package/2006/relationships",
}


def load_shared_strings(zf: zipfile.ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in zf.namelist():
        return []

    root = ET.fromstring(zf.read("xl/sharedStrings.xml"))
    strings: list[str] = []
    for si in root.findall("main:si", NS):
        strings.append("".join((t.text or "") for t in si.iterfind(".//main:t", NS)))
    return strings


def get_sheet_root(zf: zipfile.ZipFile, sheet_name: str) -> ET.Element:
    workbook = ET.fromstring(zf.read("xl/workbook.xml"))
    rels = ET.fromstring(zf.read("xl/_rels/workbook.xml.rels"))
    rel_map = {r.attrib["Id"]: r.attrib["Target"] for r in rels.findall("rel:Relationship", NS)}

    for sheet in workbook.find("main:sheets", NS):
        if sheet.attrib["name"] != sheet_name:
            continue
        rel_id = sheet.attrib[
            "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
        ]
        target = rel_map[rel_id]
        if not target.startswith("xl/"):
            target = "xl/" + target.replace("/xl/", "").lstrip("/")
        return ET.fromstring(zf.read(target))

    raise ValueError(f"Sheet not found: {sheet_name}")


def read_cell_value(cell: ET.Element, shared_strings: list[str]) -> str | None:
    cell_type = cell.attrib.get("t")
    value_node = cell.find("main:v", NS)
    inline_string = cell.find("main:is", NS)

    if cell_type == "s" and value_node is not None and value_node.text is not None:
        index = int(value_node.text)
        return shared_strings[index] if 0 <= index < len(shared_strings) else value_node.text

    if cell_type == "inlineStr" and inline_string is not None:
        return "".join((t.text or "") for t in inline_string.iterfind(".//main:t", NS))

    if value_node is not None:
        return value_node.text

    return None


def row_cells(sheet_root: ET.Element, shared_strings: list[str]) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for row in sheet_root.iterfind(".//main:row", NS):
        row_map: dict[str, str] = {}
        for cell in row.findall("main:c", NS):
            value = read_cell_value(cell, shared_strings)
            if value not in (None, ""):
                row_map[cell.attrib["r"]] = value
        if row_map:
            rows.append(row_map)
    return rows


def value_from_column(row: dict[str, str], column: str) -> str | None:
    pattern = re.compile(rf"^{re.escape(column)}\d+$")
    for ref, value in row.items():
        if pattern.match(ref):
            return value
    return None


def normalize_token_rows(rows: list[dict[str, str]]) -> list[dict[str, Any]]:
    normalized: list[dict[str, Any]] = []
    for row in rows:
        level_1 = value_from_column(row, "C")
        level_2 = value_from_column(row, "D")
        level_3 = value_from_column(row, "E")
        address = value_from_column(row, "F")
        entity = value_from_column(row, "G")
        subsection = value_from_column(row, "H")
        token_name = value_from_column(row, "I")

        if not level_1 or not level_2 or not address or not entity or not subsection or not token_name:
            continue

        if address == "Id_#" or entity == "Entity" or token_name == "Token_Name":
            continue

        normalized.append(
            {
                "index": value_from_column(row, "B"),
                "level_1": level_1,
                "level_2": level_2,
                "level_3": level_3,
                "address": address,
                "entity": entity,
                "subsection": subsection,
                "token_name": token_name,
                "token_type": value_from_column(row, "J"),
                "node_type": value_from_column(row, "K"),
                "level": value_from_column(row, "L"),
                "parent_id": value_from_column(row, "M"),
            }
        )
    return normalized


def build_schema(rows: list[dict[str, Any]], workbook_name: str) -> OrderedDict[str, Any]:
    entities: OrderedDict[str, Any] = OrderedDict()

    for row in rows:
        entity_key = str(row["level_1"])
        subsection_key = f'{row["level_1"]}.{row["level_2"]}.0'

        entity_entry = entities.setdefault(
            entity_key,
            OrderedDict(
                [
                    ("level_1", row["level_1"]),
                    ("entity", row["entity"]),
                    ("entity_address", f'{row["level_1"]}.0.0'),
                    ("subsections", OrderedDict()),
                ]
            ),
        )

        subsection_entry = entity_entry["subsections"].setdefault(
            subsection_key,
            OrderedDict(
                [
                    ("level_2", row["level_2"]),
                    ("subsection", row["subsection"]),
                    ("subsection_address", subsection_key),
                    ("parent_id", row["parent_id"]),
                    ("tokens", []),
                ]
            ),
        )

        subsection_entry["tokens"].append(
            OrderedDict(
                [
                    ("index", row["index"]),
                    ("level_3", row["level_3"]),
                    ("address", row["address"]),
                    ("token_name", row["token_name"]),
                    ("token_type", row["token_type"]),
                    ("node_type", row["node_type"]),
                    ("level", row["level"]),
                    ("parent_id", row["parent_id"]),
                ]
            )
        )

    return OrderedDict(
        [
            ("workbook_file", workbook_name),
            ("source_sheet", "Tokens"),
            (
                "notes",
                [
                    "Workbook is the human editing surface.",
                    "This JSON companion is the machine-readable indexing companion.",
                    "Section labels may evolve, but addresses should remain stable whenever possible.",
                ],
            ),
            (
                "addressing",
                OrderedDict(
                    [
                        ("entity_address_pattern", "L1.0.0"),
                        ("subsection_address_pattern", "L1.L2.0"),
                        ("token_address_pattern", "L1.L2.L3"),
                    ]
                ),
            ),
            ("entities", list(entities.values())),
        ]
    )


def main() -> int:
    repo_root = Path(__file__).resolve().parents[1]
    workbook_path = repo_root / "docs" / "B10_DOS v260400 vrev.xlsx"
    output_path = repo_root / "docs" / "001-workbook-schema-companion.json"

    if not workbook_path.exists():
        raise FileNotFoundError(f"Workbook not found: {workbook_path}")

    with zipfile.ZipFile(workbook_path) as zf:
        shared = load_shared_strings(zf)
        tokens_root = get_sheet_root(zf, "Tokens")
        rows = row_cells(tokens_root, shared)

    schema_rows = normalize_token_rows(rows)
    payload = build_schema(schema_rows, workbook_path.name)
    output_path.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")

    print(f"Wrote {output_path}")
    print(f"Entities: {len(payload['entities'])}")
    print(f"Token rows: {len(schema_rows)}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
