"""רשם החברות ב-data.gov.il: אימות שהחברה קיימת ופעילה, ומציאת ח"פ.
המאגר לא כולל מספר עובדים. אם ה-API לא זמין או השתנה, מחזירים None והסוכן ממשיך."""
import os
import requests

RESOURCE = os.getenv("DATAGOV_RESOURCE_ID", "f004176c-b85f-4542-8901-7b3e9cd0d3fb")
URL = "https://data.gov.il/api/3/action/datastore_search"


def lookup(name):
    try:
        r = requests.get(URL, params={"resource_id": RESOURCE, "q": name, "limit": 3}, timeout=15)
        recs = r.json()["result"]["records"]
    except Exception:
        return None
    for rec in recs:
        status = str(rec.get("סטטוס חברה", ""))
        return {"registry_name": rec.get("שם חברה"), "company_id": rec.get("מספר חברה"),
                "active": "פעילה" in status or not status}
    return None
