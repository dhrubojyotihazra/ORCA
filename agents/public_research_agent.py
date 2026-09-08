"""
ORCA Public Source Research Agent (SIH26176)
Narrow, source-restricted lookup tool checking an allowlist of official government
marine/meteorological portals when live telemetry APIs do not cover bulletins/alerts.
Strict zero-fabrication guardrail and verified SSL validation.
"""

import ssl
import certifi
import urllib.request
import urllib.parse
import datetime
import re
from typing import Dict, Any, List, Optional
from bs4 import BeautifulSoup

from .state import AgentState, PublicResearchData

# ─────────────────────────────────────────────────────────────
# 1. STRICT HARDCODED ALLOWLIST (Zero arbitrary URLs permitted)
# ─────────────────────────────────────────────────────────────
ALLOWLISTED_DOMAINS = {
    "mausam.imd.gov.in",
    "incois.gov.in",
    "ndma.gov.in",
    "www.mosdac.gov.in",
    "mosdac.gov.in",
    "www.sac.gov.in",
    "sac.gov.in",
}

ALLOWLISTED_SOURCES = [
    {
        "agency": "India Meteorological Department (IMD)",
        "domain": "mausam.imd.gov.in",
        "url": "https://mausam.imd.gov.in/responsive/cycloneinformation.php",
        "topic": "cyclone",
        "title": "IMD Tropical Cyclone & Weather Outlook Bulletins",
    },
    {
        "agency": "India Meteorological Department (IMD)",
        "domain": "mausam.imd.gov.in",
        "url": "https://mausam.imd.gov.in/responsive/all_india_forcast_bulletin.php",
        "topic": "forecast_bulletin",
        "title": "IMD All-India Daily Weather Forecast & Fishermen Warning Bulletin",
    },
    {
        "agency": "Indian National Centre for Ocean Information Services (INCOIS)",
        "domain": "incois.gov.in",
        "url": "https://incois.gov.in/",
        "topic": "incois_bulletin",
        "title": "INCOIS Marine Ocean Advisory & Special Bulletins",
    },
    {
        "agency": "National Disaster Management Authority (NDMA)",
        "domain": "ndma.gov.in",
        "url": "https://ndma.gov.in/Natural-Hazards/Cyclone",
        "topic": "ndma_cyclone",
        "title": "NDMA National Cyclone Hazard Mitigation Advisory",
    },
    {
        "agency": "Space Applications Centre / ISRO (MOSDAC)",
        "domain": "www.mosdac.gov.in",
        "url": "https://www.mosdac.gov.in/",
        "topic": "mosdac_marine",
        "title": "ISRO MOSDAC Satellite Oceanography Public Portal",
    },
]

# Navigation / boilerplate phrases that MUST NOT be mistaken for a substantive bulletin
BOILERPLATE_PATTERNS = [
    re.compile(r"navigation menu|skip to main content|terms of use|privacy policy|disclaimer|sitemap|copyright", re.I),
    re.compile(r"citizen'?s charter|internal complaint|sexual harassment|recruitment to the post", re.I),
    re.compile(r"screen reader access|font size|feedback|contact us|admin login|database login", re.I),
    re.compile(r"weather links|miscellaneous|previous next page of loading", re.I),
]

METEOROLOGICAL_KEYWORDS = [
    "cyclone", "depression", "low-pressure", "low pressure", "warning", "bulletin",
    "squall", "gale", "storm", "rough sea", "heavy rainfall", "fishermen", "forecast",
    "subdued rainfall", "well marked", "bay of bengal", "arabian sea", "trough",
]

STOPWORDS = {
    "what", "is", "the", "latest", "official", "bulletin", "bulletins", "alert", "alerts",
    "status", "for", "and", "there", "regarding", "any", "are", "about", "show", "tell",
    "check", "from", "government", "public", "portal", "website", "coast", "coastal", "near",
    "today", "tomorrow", "this", "does", "have", "with", "information", "details", "give",
    "imd", "incois", "ndma", "mosdac", "warning", "warnings", "forecast", "report", "please",
    "surface", "area", "zone", "state", "region", "water", "sea", "ocean", "india", "level",
    "time", "date", "national", "centre", "center", "department", "meteorological", "services",
    "system", "daily", "all", "indian"
}


def _create_verified_ssl_context() -> ssl.SSLContext:
    """
    Creates an SSL context with certificate verification enabled using certifi's CA bundle.
    Strictly avoids ssl.CERT_NONE.
    """
    ctx = ssl.create_default_context(cafile=certifi.where())
    ctx.check_hostname = True
    ctx.verify_mode = ssl.CERT_REQUIRED
    return ctx


def _fetch_allowlisted_url(url: str, timeout_sec: int = 5) -> Optional[str]:
    """
    Fetches an allowlisted government URL securely.
    Rejects any URL not in ALLOWLISTED_DOMAINS.
    """
    parsed = urllib.parse.urlparse(url)
    if parsed.netloc.lower() not in ALLOWLISTED_DOMAINS:
        return None

    ctx = _create_verified_ssl_context()
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) ORCA-Maritime-Research/1.0",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    }
    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=timeout_sec) as res:
            if res.status == 200:
                raw_bytes = res.read(60000)  # read first 60KB
                return raw_bytes.decode("utf-8", errors="ignore")
    except Exception:
        return None
    return None


def _clean_and_extract_bulletin(html_content: str, query_topic: str) -> Optional[Dict[str, str]]:
    """
    Parses HTML content, strips all navigation and boilerplate, and extracts
    only genuine meteorological / disaster bulletins matching the user's topic.
    Enforces the zero-fabrication rule: returns None if only navigation or irrelevant text is present.
    """
    soup = BeautifulSoup(html_content, "html.parser")

    # 1. Strip out non-content and navigation elements completely
    for tag in soup(["script", "style", "nav", "header", "footer", "form", "select", "noscript", "aside", "iframe"]):
        tag.decompose()

    # Also remove common menu / footer classes
    for element in soup.find_all(class_=re.compile(r"menu|navbar|nav|footer|header|sidebar|breadcrumb|dropdown", re.I)):
        element.decompose()

    # 2. Extract cleaned text paragraphs
    text_blocks: List[str] = []
    for p in soup.find_all(["p", "div", "article", "section", "td", "span"]):
        block = p.get_text(separator=" ", strip=True)
        # Filter out short snippets or navigation blocks
        if len(block) > 40 and not any(bp.search(block) for bp in BOILERPLATE_PATTERNS):
            text_blocks.append(block)

    if not text_blocks:
        return None

    # 3. Strict Subject Topic Matching (Zero-Fabrication Guardrail)
    # Extract substantive query keywords (excluding generic question filler)
    query_tokens = [
        w.strip().lower()
        for w in re.findall(r"\b[a-zA-Z]{3,}\b", query_topic)
        if w.lower() not in STOPWORDS
    ]

    candidate_bulletins: List[str] = []

    for block in text_blocks:
        block_lower = block.lower()
        
        # Must contain at least one recognized meteorological indicator
        has_met = any(k in block_lower for k in METEOROLOGICAL_KEYWORDS)
        if not has_met:
            continue

        # Reject if block contains mostly boilerplate words
        nav_words = sum(1 for w in ["home", "menu", "contact", "login", "feedback", "charter", "officer"] if w in block_lower)
        if nav_words >= 2:
            continue

        # CRITICAL: If the user specified distinctive subject keywords, the block MUST contain at least one!
        if query_tokens:
            matches_subject = any(tok in block_lower for tok in query_tokens)
            if not matches_subject:
                continue

        candidate_bulletins.append(block)

    if not candidate_bulletins:
        return None

    # Pick the most detailed relevant bulletin segment
    best_candidate = max(candidate_bulletins, key=len)

    # Clean up whitespace
    cleaned_snippet = re.sub(r"\s+", " ", best_candidate).strip()
    if len(cleaned_snippet) < 50:
        return None

    # Extract summary (first 2-3 substantive sentences, max 320 chars)
    sentences = re.split(r"(?<=[.!?])\s+", cleaned_snippet)
    summary_sentences = []
    total_len = 0
    for s in sentences:
        if total_len > 240:
            break
        summary_sentences.append(s)
        total_len += len(s)

    summary = " ".join(summary_sentences).strip()

    title = soup.title.string.strip() if soup.title and soup.title.string else "Official Government Bulletin"
    title = re.sub(r"\s+", " ", title)

    return {
        "title": title,
        "summary": summary,
        "raw_snippet": cleaned_snippet[:350],
    }


def public_research_node(state: AgentState) -> Dict[str, Any]:
    """
    Public Source Research Agent Node in LangGraph.
    Only checks allowlisted government sources for active bulletins when primary APIs don't cover it.
    Strict zero-fabrication guarantee: returns found=False if no bulletin matches.
    """
    query = (state.get("transcribed_text") or state.get("query", "")).strip()
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()
    checked_sources: List[str] = []

    # Select candidate allowlisted sources based on user inquiry
    q_lower = query.lower()
    selected_targets = []

    if any(k in q_lower for k in ["cyclone", "storm", "depression"]):
        selected_targets = [s for s in ALLOWLISTED_SOURCES if s["topic"] == "cyclone"]
    elif any(k in q_lower for k in ["forecast", "weather bulletin", "monsoon"]):
        selected_targets = [s for s in ALLOWLISTED_SOURCES if s["topic"] in ["cyclone", "forecast_bulletin"]]
    elif any(k in q_lower for k in ["ndma", "disaster", "hazard", "evacuation"]):
        selected_targets = [s for s in ALLOWLISTED_SOURCES if s["topic"] == "ndma_cyclone"]
    elif any(k in q_lower for k in ["pfz", "fish", "ocean bulletin", "incois"]):
        selected_targets = [s for s in ALLOWLISTED_SOURCES if s["topic"] == "incois_bulletin"]
    else:
        # Default to IMD cyclone & forecast bulletins
        selected_targets = [s for s in ALLOWLISTED_SOURCES if s["topic"] in ["cyclone", "forecast_bulletin"]]

    # Execute secure fetch and extraction
    found_result: Optional[PublicResearchData] = None

    for target in selected_targets:
        url = target["url"]
        checked_sources.append(url)
        html = _fetch_allowlisted_url(url, timeout_sec=5)
        if not html:
            continue

        extracted = _clean_and_extract_bulletin(html, query)
        if extracted and len(extracted.get("summary", "")) > 40:
            found_result = {
                "found": True,
                "agency": target["agency"],
                "source_url": url,
                "retrieved_at": now_iso,
                "source_type": "Official Government Bulletin (Secondary/Cached)",
                "confidence": "Secondary source — not a live authoritative feed",
                "bulletin_title": extracted["title"],
                "summary": extracted["summary"],
                "raw_snippet": extracted["raw_snippet"],
                "checked_sources": checked_sources,
            }
            break

    if found_result:
        citation = (
            f"Source: {found_result['agency']} Public Bulletin ({found_result['source_url']}) | "
            f"Retrieved: {found_result['retrieved_at']} | "
            f"Secondary source — verify with official channels before making safety-critical decisions."
        )
        return {
            "public_research_data": found_result,
            "evidence_citations": [citation],
        }
    else:
        # ZERO-FABRICATION GUARANTEE: Explicit structured not-found response
        not_found_payload: PublicResearchData = {
            "found": False,
            "reason": "No active official government bulletin matching the query was identified on checked public portals",
            "checked_sources": checked_sources,
            "source_type": "Official Government Bulletin (Secondary/Cached)",
            "confidence": "Secondary source — not a live authoritative feed",
            "retrieved_at": now_iso,
        }
        citation = (
            f"Public Research Agent: No official bulletin found on checked sources ({', '.join(checked_sources)}) | "
            f"Retrieved: {now_iso} | Secondary source verification check complete."
        )
        return {
            "public_research_data": not_found_payload,
            "evidence_citations": [citation],
        }
