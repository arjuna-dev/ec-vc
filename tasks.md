# Technical Tasks Document

## EC-VC Desktop Application Development

**Version:** 2.0**Date:** January 23, 2026**Development Phase:** Barebones End-to-End Pipeline MVP

---

## 1. Development Overview

### 1.1 Current State Analysis

- **Foundation:** Quasar Vue 3 + Electron application shell established
- **Status:** Basic project structure with demo components
- **Ready Components:** MainLayout, IndexPage, EssentialLink component
- **Tech Stack:** Vue 3, Quasar 2.16.0, Electron 40.0.0, Vite build system

### 1.2 Pipeline-First MVP Strategy

**Goal:** Build the thinnest possible slice through the entire pipeline to validate the end-to-end flow before adding features.

**Pipeline Flow:**

1. **FS Mirror** → Basic file system browsing
2. **FS Structure Creation** → Create output directory structure
3. **Skip Wizard** → Direct to main interface
4. **Drag & Drop** → Multiple file types (PDF, DOCX, TXT, XLSX)
5. **LLM Categorization** → Structured outputs to determine file placement and organization
6. **Document Conversion** → PDFs via LLM (JSON→markdown), others via pandoc
7. **Skip Requirements Lists** → No validation, just process
8. **Final LLM Processing** → User triggers final analysis generation from all processed documents
9. **Output Generation** → Investment insights and analysis saved to final directory

### 1.3 Development Timeline

- **Week 1:** Core dependencies and basic FS operations
- **Week 2:** Directory structure creation and drag-drop
- **Week 3:** Single file conversion and LLM integration
- **Week 4:** End-to-end pipeline testing and refinement

---

## 2. Pipeline MVP Tasks (4 Weeks Total)

### 2.1 Week 1: Foundation and FS Operations

**Goal:** Get basic file system mirroring and structure creation working

#### 2.1.1 Essential Dependencies Only

- [ ] **TASK-001:** Add core packages to package.json (2 days)

  ```bash
  npm install fs-extra @ai-sdk/openai ai
  ```

  - `fs-extra` - Enhanced file system operations
  - `@ai-sdk/openai` - Single LLM provider for MVP
  - `ai` - Vercel AI core
  - Include platform-specific pandoc executables (Windows/macOS) - no development needed, just bundle them

#### 2.1.2 Basic Electron IPC Setup

- [ ] **TASK-002:** Minimal IPC for file operations in `src-electron/electron-preload.js` (1 day)
  - Expose basic file system operations
  - Simple directory creation methods
  - Skip security enhancements for MVP

#### 2.1.3 Basic File System Mirror

- [ ] **TASK-003:** Simple FS browsing component (2 days)
  - Replace `IndexPage.vue` with basic file browser
  - Show directories and files in a simple list
  - Click to navigate directories
  - No advanced features (search, context menus, etc.)

### 2.2 Week 2: Directory Structure and Drag-Drop

**Goal:** Create output structure and accept file uploads

#### 2.2.1 Project Directory Creation

- [ ] **TASK-004:** Implement basic project structure creation (2 days)
  - Simple directory structure service
  - Create basic folders and child folders: `00_original`, `01_processed`, `02_output`
  - No templates or complex validation

#### 2.2.2 Drag and Drop Interface

- [ ] **TASK-005:** Enhanced drag-drop for multiple file types (3 days)
  - Support multiple file types: PDF, DOCX, TXT, XLSX
  - Simple drop zone component
  - File validation for supported formats
  - Copy files to `00_original` directory

### 2.3 Week 3: File Conversion and LLM Integration

**Goal:** Convert one file type and get basic LLM processing

#### 2.3.1 LLM File Categorization

- [ ] **TASK-006:** LLM file categorization with structured outputs (2 days)
  - Purpose: Categorize files and determine correct directory placement
  - Use structured outputs to get JSON response with target directory path
  - Prompt: "Analyze this file and categorize it. Return the appropriate directory path."
  - Expected JSON: `{"category": "financial_statements", "directory_path": "00_original/financials/", "confidence": 0.95}`
  - Organize files in categorized subdirectories

#### 2.3.2 Document Conversion Pipeline

- [ ] **TASK-007:** Multi-format document conversion pipeline (3 days)
  - **For PDFs:** Send to LLM for processing → structured JSON output → convert JSON to markdown locally
  - **For other formats (DOCX, TXT, XLSX):** Use pandoc conversion to markdown
  - LLM handles OCR/complex extraction for PDFs with structured outputs
  - Pandoc handles straightforward conversions for office documents
  - Save all markdown files in `01_processed` with organized subdirectories
  - Hardcoded API key for MVP (no secure storage)

### 2.4 Week 4: Final Output Generation and Testing

**Goal:** Complete the pipeline with final LLM processing and testing

#### 2.4.1 Final LLM Processing

- [ ] **TASK-008:** Final insights generation (3 days)
  - Create trigger button/interface to process all categorized documents
  - Collect all markdown files from `01_processed`
  - Send batch to LLM for final analysis: "Generate investment analysis and key insights from these startup documents"
  - Save final outputs (investment memo, analysis, recommendations) to `02_output`
  - Basic error handling and progress indication

#### 2.4.2 End-to-End Testing

- [ ] **TASK-009:** Complete pipeline testing and bug fixes (2 days)
  - Test complete flow: Upload → Categorize → Convert → Final Processing
  - Test with sample files (PDF, DOCX, TXT)
  - Fix any blocking bugs
  - Ensure all steps work together smoothly

---

## 3. Implementation Details for Barebones MVP

### 3.1 Simplified File Structure

For MVP, we'll work with minimal directory structure:

```
project_root/
├── 00_original/          # Dropped files go here
├── 01_processed/         # Converted markdown files
└── 02_output/           # LLM-generated text files
```

### 3.2 MVP Components to Create/Modify

#### 3.2.1 Essential Files to Modify

- `src/pages/IndexPage.vue` → Transform into main file browser + drop zone
- `src-electron/electron-preload.js` → Add basic file system bridge
- `package.json` → Add minimal dependencies

#### 3.2.2 New Components to Create (Minimal)

- `src/components/FileDropZone.vue` - Basic drag-drop area
- `src/services/filesystem.js` - Basic file operations
- `src/services/llm.js` - Simple OpenAI integration
- `src/services/converter.js` - Basic PDF text extraction

### 3.3 MVP Limitations and Scope Cuts

#### 3.3.1 Features to Skip for MVP

- ❌ Wizard component and onboarding flow
- ❌ Document requirements checklist
- ❌ User preferences and settings
- ❌ Multiple file format support (PDF only)
- ❌ Secure API key storage (hardcoded for MVP)
- ❌ Advanced error handling and retries
- ❌ File system monitoring with chokidar
- ❌ Pandoc integration (use simple text extraction)
- ❌ Multiple LLM providers (OpenAI only)
- ❌ Complex UI components and layouts
- ❌ State management with Pinia
- ❌ Schema validation with Zod
- ❌ Progress tracking and notifications

#### 3.3.2 MVP Scope - What We WILL Build

- ✅ Basic file system browsing (simple directory listing)
- ✅ Project directory creation (3 folders)
- ✅ Drag-drop for PDF files only
- ✅ Basic PDF text extraction to markdown
- ✅ Single LLM call for categorization + processing
- ✅ Save LLM output as text file
- ✅ Minimal error handling (try/catch blocks)
- ✅ Basic UI feedback (loading states)

---

## 4. Post-MVP Enhancement Roadmap

Once the barebones pipeline is working, we can incrementally add:

### 4.1 Immediate Enhancements (Week 5-6)

- Add more file formats (DOCX, TXT)
- Implement proper pandoc integration
- Add basic error handling and user feedback
- Create simple wizard for API key setup

### 4.2 Short-term Enhancements (Week 7-10)

- Multiple LLM provider support
- Better UI components and layouts
- File system monitoring
- Document requirements tracking
- State management with Pinia

### 4.3 Medium-term Features (Week 11-16)

- Advanced document categorization
- Batch processing capabilities
- Export and sharing features
- User preferences and settings
- Security enhancements

---

## 5. Critical Success Metrics for MVP

### 5.1 Pipeline Completion Criteria

- [ ] User can browse local file system
- [ ] User can create a project directory structure
- [ ] User can drag-drop a PDF file
- [ ] File gets copied to `00_original` directory
- [ ] PDF text is extracted and saved as markdown in `01_processed`
- [ ] LLM processes the markdown and returns insights
- [ ] LLM output is saved as text file in `02_output`
- [ ] Entire pipeline completes in under 2 minutes for typical document

### 5.2 Quality Gates (Minimal)

- [ ] Application starts without errors
- [ ] Can process at least one sample PDF successfully
- [ ] No crashes during normal operation
- [ ] Basic error messages for common failures
- [ ] File output is readable and contains expected content

---

## 6. Technical Implementation Strategy

### 6.1 Development Approach

1. **Build in sequence** - Complete each pipeline step before moving to next
2. **Test at each step** - Ensure data flows correctly between stages
3. **Minimal UI** - Focus on functionality over aesthetics
4. **Hardcode when needed** - API keys, paths, prompts can be hardcoded for MVP
5. **Single file type** - Master PDF processing before adding complexity

### 6.2 Risk Mitigation for MVP

- **Risk:** PDF text extraction fails
  - **Mitigation:** Test with multiple PDF samples, implement fallback message
- **Risk:** LLM API calls fail or timeout
  - **Mitigation:** Basic retry logic, clear error messages to user
- **Risk:** File system permissions issues
  - **Mitigation:** Test on both macOS and Windows, provide setup instructions

---

## 7. MVP Acceptance Criteria

### 7.1 Demo Script

The MVP should support this end-to-end workflow:

1. **Start Application** - Opens to file browser view
2. **Create Project** - Click "New Project" → creates directory structure
3. **Upload Document** - Drag PDF file to drop zone
4. **Automatic Processing** - Watch file move through pipeline stages
5. **View Results** - Check `02_output` folder for LLM-generated insights
6. **Success** - Complete workflow in under 5 minutes

### 7.2 MVP Deliverables

- [ ] Working desktop application (Windows + macOS)
- [ ] Sample PDF files for testing
- [ ] Basic documentation for setup and usage
- [ ] Video demonstration of end-to-end workflow

---

_This streamlined approach prioritizes proving the concept end-to-end over feature completeness. Once validated, we can systematically enhance each component._
