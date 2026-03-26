# Multi-Photo Sheet + Per-Photo Scale/Position

## Requirements
- **Multi-upload**: Upload multiple photos (up to 20), assign to grid cells individually
- **Per-photo editing**: In preview, click photo → drag/scale individually (offsetX/Y/scale per photo)
- **Grid fit**: Manual shrink/move to adjust borders/perfect fit

## Plan
**Information:**
- Current: single photo tiled same image
- Need: photo array, per-cell image/scale/offset state
- UI: Multi-upload zone, grid selector, individual editors

**Files to edit:**
1. `src/pages/Index.tsx` - Multi photos state, upload handler, per-photo template data
2. `src/lib/imageProcessing.ts` - `generatePrintSheet(perPhotoData: {url: string, offsetX, offsetY, scale}[])`
3. `src/components/ExportPanel.tsx` - Photo list, per-photo editor UI, interactive preview canvas
4. New `src/components/PhotoGridEditor.tsx` - Click photo → drag/scale controls

**Followup:** Test 2+ photos, individual positioning, perfect fit.

Proceed?
