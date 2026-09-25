import re
from app.utils.logger import logger

try:
    from indic_transliteration import sanscript  # type: ignore # pyrefly: ignore [missing-import]
    from indic_transliteration.sanscript import transliterate  # type: ignore # pyrefly: ignore [missing-import]
    INDIC_AVAILABLE = True
except ImportError:
    INDIC_AVAILABLE = False


def _sanitize_hinglish_text(text: str) -> str:
    if not text:
        return text
    # Strip any Perso-Arabic script unicode range (\u0600 - \u06FF) if present
    text = re.sub(r"[\u0600-\u06FF]+", "", text).strip()
    text = text.replace(".dega", "dega").replace(".degi", "degi").replace(".d", "d").replace(".N", "n").replace(".m", "m")
    replacements = [
        (r"\bstej\b", "stage"),
        (r"\bstejas\b", "stages"),
        (r"\bstejpe\b", "stage pe"),
        (r"\bcherman\b", "chairman"),
        (r"\bcheyaramaina\b", "chairman"),
        (r"\bshmart\b", "smart"),
        (r"\bphacilitaor\b", "facilitator"),
        (r"\bkaonphidemsa\b", "confidence"),
        (r"\bkaॉnphidemsa\b", "confidence"),
        (r"\bmaltiplayara\b", "multiplier"),
        (r"\bmaltiplayar\b", "multiplier"),
        (r"\bdevalapamemta\b", "development"),
        (r"\bmotiveshana\b", "motivation"),
        (r"\bsaksesa\b", "success"),
        (r"\bgraॉpimga\b", "grouping"),
        (r"\barali\b", "early"),
        (r"\bekselaresana\b", "acceleration"),
        (r"\brioriemtesana\b", "reorientation"),
        (r"\bkoraporataijesana\b", "corporatization"),
        (r"\blibaresana\b", "liberation"),
        (r"\bekosistama\b", "ecosystem"),
        (r"\bbijnasa\b", "business"),
        (r"\bdhandewala\b", "dhandhewala"),
        (r"\bentreprenyura\b", "entrepreneur"),
        (r"\bamtreprenyura\b", "entrepreneur"),
        (r"\bsevhisa\b", "service"),
        (r"\bsavhisa\b", "service"),
        (r"\bprograॉma\b", "program"),
        (r"\bprograama\b", "program"),
        (r"\btaiyara\b", "taiyar"),
        (r"\bbahatarina\b", "behtareen"),
        (r"\bguru kula\b", "gurukul"),
        (r"\bgurukula\b", "gurukul"),
        (r"\bpa\.dega\b", "padega"),
        (r"\bpa\.degi\b", "padegi"),
        (r"\bupara\b", "upar"),
        (r"\balaga-alaga\b", "alag-alag"),
        (r"\balaga\b", "alag"),
        (r"\bkaremge\b", "karenge"),
        (r"\bjaemge\b", "jaenge"),
        (r"\bdemge\b", "denge"),
        (r"\bapako\b", "aapko"),
        (r"\bapane\b", "apne"),
        (r"\bapani\b", "apni"),
        (r"\bchij\b", "cheez"),
        (r"\bchijom\b", "cheezon"),
        (r"\bmatalaba\b", "matlab"),
        (r"\bisa\b", "is"),
        (r"\busa\b", "us"),
        (r"\bjisaka\b", "jiska"),
        (r"\bloga\b", "log"),
        (r"\bbahuta\b", "bahut"),
        (r"\bsatom\b", "saaton"),
        (r"\bmujharemge\b", "guzrenge"),
        (r"\bdhyana\b", "dhyan"),
        (r"\badatom\b", "aadat"),
        (r"\bE for tough\b", "T for tough"),
        (r"\bdil man\b", "the man"),
        (r"\bman hos\b", "man who is"),
        (r"\bwich\b", "with"),
        (r"\bsam\b", "some"),
        (r"\bskils\b", "skills"),
        (r"\bpeepol\b", "people"),
        (r"\bordinari\b", "ordinary"),
        (r"\bkepyabiliteaja\b", "capabilities"),
        (r"\bkaaphabila\b", "kaabil"),
        (r"\bsherom\b", "shehron"),
    ]
    for pat, repl in replacements:
        text = re.sub(pat, repl, text, flags=re.IGNORECASE)

    return text


def _to_hinglish(text: str) -> str:
    if not text:
        return text
    # Strip any leftover Urdu script range before transliteration
    text = re.sub(r"[\u0600-\u06FF]+", "", text).strip()
    if not INDIC_AVAILABLE or not text:
        return text
    if any("\u0900" <= char <= "\u097F" for char in text):
        try:
            words = text.split(" ")
            res_words = []
            for w in words:
                if any("\u0900" <= char <= "\u097F" for char in w):
                    clean_w = w.strip(".,?!:;\"()")
                    t = transliterate(clean_w, sanscript.DEVANAGARI, sanscript.ITRANS)
                    t = t.replace(".N", "n").replace(".m", "m").replace("A", "a").replace("I", "i").replace("U", "u")
                    t = t.replace("M", "m").replace("R", "r").replace("S", "sh").replace("T", "t")
                    t = t.replace("D", "d").replace("N", "n").replace("^", "").replace("shh", "sh").replace(".d", "d")
                    if t.endswith("a") and len(t) > 2 and not t.endswith(("aa", "ia", "ua", "ea", "oa", "ra", "ka", "ga", "ya", "ha", "ba", "ma", "pa", "la", "na", "sa", "va", "ta", "da")):
                        t = t[:-1]
                    w_trans = w.replace(clean_w, t)
                    res_words.append(w_trans)
                else:
                    res_words.append(w)
            raw_hinglish = " ".join(res_words)
            return _sanitize_hinglish_text(raw_hinglish)
        except Exception:
            return text
    return _sanitize_hinglish_text(text)
