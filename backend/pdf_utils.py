import pdfplumber
import re


def extract_text_from_pdf(pdf_path: str) -> str:
    if not pdf_path:
        return ""

    text_pages = []
    try:
        with pdfplumber.open(pdf_path) as pdf:
            if not pdf.pages:
                return ""
            for i, page in enumerate(pdf.pages):
                try:
                    page_text = page.extract_text()
                    if page_text and page_text.strip():
                        text_pages.append(page_text.strip())
                except Exception as e:
                    print(f"[PDF] Page {i} failed: {e}")
                    continue
    except Exception as e:
        print(f"[PDF] Extraction failed: {e}")
        return ""

    full_text = "\n\n".join(text_pages)
    full_text = re.sub(r"\n{3,}", "\n\n", full_text)
    full_text = re.sub(r" {2,}", " ", full_text)
    return full_text.strip()
