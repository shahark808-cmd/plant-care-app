"""Supabase REST: כתיבת לידים וקריאת לידים קיימים/פסולים. המפתח service_role רק בסביבת הסוכן."""
import os
import requests


def _cfg():
    url, key = os.getenv("SUPABASE_URL"), os.getenv("SUPABASE_SERVICE_KEY")
    if not (url and key):
        return None
    return url.rstrip("/") + "/rest/v1/leads", {"apikey": key, "Authorization": f"Bearer {key}",
                                                 "Content-Type": "application/json"}


def enabled():
    return _cfg() is not None


def known():
    """מחזיר (כל שמות החברות שכבר במאגר, רשימת סיבות פסילה)."""
    cfg = _cfg()
    if not cfg:
        return set(), []
    url, h = cfg
    r = requests.get(url, headers=h, params={"select": "name,status,reject_reason"}, timeout=30)
    r.raise_for_status()
    rows = r.json()
    return {x["name"] for x in rows}, [x["reject_reason"] for x in rows
                                      if x.get("status") == "rejected" and x.get("reject_reason")]


FIELDS = ("name", "sector", "employees_estimate", "employees_confidence", "employees_source",
          "score", "rationale", "pain_signals", "channels_today", "contact_center_notes",
          "contact_role", "sources")


def save(leads):
    cfg = _cfg()
    if not cfg or not leads:
        return 0
    url, h = cfg
    rows = [{k: l.get(k) for k in FIELDS} for l in leads]
    # אם החברה כבר קיימת (למשל פסולה), לא דורסים אותה
    r = requests.post(url, headers={**h, "Prefer": "resolution=ignore-duplicates,return=minimal"},
                      params={"on_conflict": "name"}, json=rows, timeout=60)
    r.raise_for_status()
    return len(rows)
