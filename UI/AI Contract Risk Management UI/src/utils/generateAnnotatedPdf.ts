import { PDFDocument, PDFName, PDFArray, PDFNumber, PDFString } from 'pdf-lib';
import * as pdfjs from 'pdfjs-dist';

// Ensure the pdfjs worker is configured in this module's context too
if (!pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;
}

// Risk-level annotation colors (RGB 0–1 scale)
const RISK_COLORS: Record<string, [number, number, number]> = {
    high: [1, 0.3, 0.3],       // red
    moderate: [1, 0.65, 0.1],  // orange
    medium: [1, 0.65, 0.1],    // orange
    low: [0.4, 0.85, 0.4],     // green
};

/**
 * Normalize text for fuzzy matching: lowercase, collapse whitespace, strip punctuation
 */
function normalize(text: string): string {
    return text.toLowerCase().replace(/\s+/g, ' ').replace(/[^\w\s]/g, '').trim();
}

/**
 * Check if a word/span str is contained within any risky clause text.
 * Returns the matching clause if found, null otherwise.
 */
function findMatchingClause(word: string, clauses: any[]): any | null {
    const normWord = normalize(word);
    if (normWord.length < 3) return null;

    for (const clause of clauses) {
        const clauseNorm = normalize(clause.clause_text || '');
        if (clauseNorm.includes(normWord)) {
            return clause;
        }
    }
    return null;
}

interface TextItem {
    str: string;
    transform: number[]; // [scaleX, skewX, skewY, scaleY, tx, ty]
    width: number;
    height: number;
}

/**
 * Generate a PDF with native Highlight annotations for each risky clause.
 *
 * @param file     - The original uploaded File object
 * @param results  - Array of clause analysis results from the AI backend
 * @returns        - Uint8Array of the annotated PDF bytes
 */
export async function generateAnnotatedPdf(file: File, results: any[]): Promise<Uint8Array> {
    const fileBuffer = await file.arrayBuffer();

    // Load with pdf-lib for modification
    const pdfDoc = await PDFDocument.load(fileBuffer, { ignoreEncryption: true });
    const pages = pdfDoc.getPages();

    // Load a *copy* of the buffer with pdfjs for text extraction
    // (pdf-lib and pdfjs both consume the buffer, so we need separate copies)
    const pdfjsBuffer = fileBuffer.slice(0);
    const loadingTask = pdfjs.getDocument({ data: pdfjsBuffer });
    const pdfjsDoc = await loadingTask.promise;

    // Only annotate clauses that have actual risk level content
    const riskyClauses = results.filter(c =>
        c.clause_text?.trim() &&
        c.risk_level &&
        c.risk_level.toLowerCase() !== 'none'
    );

    if (riskyClauses.length === 0) {
        // No risk clauses — just return original PDF unchanged
        return pdfDoc.save();
    }

    for (let pageIdx = 0; pageIdx < pdfjsDoc.numPages; pageIdx++) {
        const pdfjsPage = await pdfjsDoc.getPage(pageIdx + 1);
        const textContent = await pdfjsPage.getTextContent();
        const pdfLibPage = pages[pageIdx];

        if (!pdfLibPage) continue;

        const pageWidth = pdfLibPage.getWidth();
        const pageHeight = pdfLibPage.getHeight();

        // Extract text items that have content
        const textItems: TextItem[] = (textContent.items as any[]).filter(
            (item): item is TextItem => 'str' in item && item.str.trim().length > 0
        );

        const annotationRefs: any[] = [];

        for (const item of textItems) {
            // pdfjs transform: [scaleX, skewX, skewY, scaleY, tx, ty]
            // tx, ty are already in PDF coordinate space (origin bottom-left)
            const scaleY = item.transform[3];
            const tx = item.transform[4];
            const ty = item.transform[5];

            const x1 = tx;
            const y1 = ty;
            const x2 = tx + Math.abs(item.width);
            const itemH = Math.abs(scaleY) || 10;
            const y2 = ty + itemH;

            // Skip items clearly outside page bounds
            if (x1 < -5 || y1 < -5 || x2 > pageWidth + 10 || y2 > pageHeight + 10) continue;

            const matchedClause = findMatchingClause(item.str, riskyClauses);
            if (!matchedClause) continue;

            const riskLevel = matchedClause.risk_level?.toLowerCase() || 'low';
            const [r, g, b] = RISK_COLORS[riskLevel] ?? RISK_COLORS.low;

            // Small padding so the highlight is slightly wider than the text
            const pad = 1;
            const rx1 = x1 - pad;
            const ry1 = y1 - pad;
            const rx2 = x2 + pad;
            const ry2 = y2 + pad;

            // QuadPoints per PDF spec: x1y1, x2y1, x1y2, x2y2 for each quad
            // (top-left, top-right, bottom-left, bottom-right in PDF coords)
            const quadPoints = [rx1, ry2, rx2, ry2, rx1, ry1, rx2, ry1];

            const contents = `[${matchedClause.risk_level?.toUpperCase()} RISK] ${matchedClause.golden_clause_type || 'Clause'}: ${(matchedClause.justification || '').slice(0, 250)}`;

            const annotDict = pdfDoc.context.obj({
                Type: PDFName.of('Annot'),
                Subtype: PDFName.of('Highlight'),
                Rect: [rx1, ry1, rx2, ry2],
                QuadPoints: quadPoints,
                C: [r, g, b],
                CA: PDFNumber.of(0.5),
                F: PDFNumber.of(4), // Print flag
                T: PDFString.of('ContractGuard AI'),
                Contents: PDFString.of(contents),
            });

            const annotRef = pdfDoc.context.register(annotDict);
            annotationRefs.push(annotRef);
        }

        if (annotationRefs.length === 0) continue;

        // Attach annotations to the page node
        const existingAnnots = pdfLibPage.node.get(PDFName.of('Annots'));
        if (existingAnnots instanceof PDFArray) {
            for (const ref of annotationRefs) existingAnnots.push(ref);
        } else {
            const arr = PDFArray.withContext(pdfDoc.context);
            for (const ref of annotationRefs) arr.push(ref);
            pdfLibPage.node.set(PDFName.of('Annots'), arr);
        }
    }

    return pdfDoc.save();
}
