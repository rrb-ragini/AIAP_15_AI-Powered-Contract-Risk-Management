import pdfplumber
from docx import Document
import io

def extract_text_from_pdf(content: bytes) -> str:
    """Extract text from PDF bytes."""
    with pdfplumber.open(io.BytesIO(content)) as pdf:
        text = ""
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text

def extract_text_from_docx(content: bytes) -> str:
    """Extract text from DOCX bytes."""
    doc = Document(io.BytesIO(content))
    return "\n".join([paragraph.text for paragraph in doc.paragraphs])

def extract_text_from_file(content: bytes, filename: str) -> str:
    """Extract text based on file extension."""
    ext = filename.split(".")[-1].lower()
    if ext == "pdf":
        return extract_text_from_pdf(content)
    elif ext == "docx":
        return extract_text_from_docx(content)
    else:
        # Assume text/plain
        try:
            return content.decode("utf-8")
        except UnicodeDecodeError:
            return content.decode("latin-1")
