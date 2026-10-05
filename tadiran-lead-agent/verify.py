"""איסוף ראיות לחברה מכל המקורות, כדי שהדירוג יתבסס רק על טקסט אמיתי."""
from common import fetch, search
from sources import datagov, jobs, maya, tenders


def gather(company):
    n = company["name"]
    site = fetch(company["website"]) if company.get("website", "").startswith("http") else ""
    reg = datagov.lookup(n)
    parts = {
        "אתר החברה": site,
        "גודל (מאיה/דירוגים)": maya.evidence(n),
        "דרושים": jobs.evidence(n),
        "מכרזים": tenders.evidence(n),
        "ערוצי שירות ותלונות": search(f"{n} שירות לקוחות וואטסאפ צ'אט זמן המתנה", 5),
        "חדשות": search(f"{n} גיוס OR מנהל חדש OR הרחבה OR מיזוג", 4),
        "רשם החברות": str(reg) if reg else "לא אומת",
    }
    return {"registry": reg, "text": "\n\n".join(f"## {k}\n{v}" for k, v in parts.items() if v)}
