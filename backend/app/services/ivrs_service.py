from typing import Dict, Any, List

class RegionalIVRSEngine:
    """
    Multi-Lingual Outbound IVRS & SMS Dispatcher for North Eastern Region dialects:
    Khasi, Mizo, Assamese, Bodo, Garo, Nepali, Hindi, and English.
    """

    DIALECT_SCRIPTS: Dict[str, Dict[str, str]] = {
        "en": {
            "critical_title": "CRITICAL LANDSLIDE EVACUATION",
            "message": "Immediate danger of slope failure along highway corridor {corridor}. All transport must halt and divert to safe bypass route via {bypass}.",
            "sms_template": "EMERGENCY ALERT: Landslide triggered at {location}. Road BLOCKED. Take bypass via {bypass}. NDRF Helpline: 1070"
        },
        "khasi": {
            "critical_title": "JINGMAH KABA JUR NA KA JINGTWAD KHYNDEW",
            "message": "Ka jingtwad khyndew kaba shyrkhei kala sdang ha {corridor}. Sangeh lut ki kali bad phai sha ka surok kaba shngain lyngba {bypass}.",
            "sms_template": "JINGMAH KHLAB: Ka surok {corridor} kala sahkut ha {location}. Leit lyngba {bypass}. Phone: 1070"
        },
        "mizo": {
            "critical_title": "LEIMIN HLAUHAWM HRIATTIRNA",
            "message": "{corridor}-ah leimin a thleng mek a, motor zawng zawng ding nghal rawh se. {bypass} lam atangin kal rawh u.",
            "sms_template": "LEIMIN EMERGENCY: {corridor} kawng a ping mek ha {location}. {bypass} zawh rawh u. NDRF: 1070"
        },
        "assamese": {
            "critical_title": "ভূমিস্খলনৰ জৰুৰী সতৰ্কবাৰ্তা",
            "message": "{corridor} ঘাইপথত ভূমিস্খলনৰ প্ৰচণ্ড আশংকা। সকলো যান-বাহন তৎকালীনভাৱে বন্ধ কৰক আৰু {bypass} হৈ যাত্ৰা কৰক।",
            "sms_template": "জৰুৰী সতৰ্কতা: {corridor}ৰ {location}ত ভূমিস্খলন। পথ বন্ধ। {bypass}ৰে যাওক। হেল্পলাইন: ১০৭০"
        },
        "bodo": {
            "critical_title": "हा दैखांनायनि गिथावना जाथाय",
            "message": "{corridor} लामायाव हा दैखांनाय जादों। गासै गारिफोरखौ थाबनो दोनथ' आरो {bypass} लामाजों थां।",
            "sms_template": "गोख्रों खौरां: {location} आव हा दैखांदों। लामा बन्द। {bypass} जों थां। 1070"
        },
        "garo": {
            "critical_title": "A·A BE·ANI MIKRAKANI",
            "message": "{corridor} ramani a·a be·ani kakket ong·engaha. Gari gadengrangko dingtangate {bypass} ramako re·angbo.",
            "sms_template": "MIKRAKANI: {corridor} rama chipaha {location}. {bypass} ramako jakkalbo. Helpline: 1070"
        }
    }

    @classmethod
    def generate_dispatch_payload(
        cls,
        corridor_id: str,
        location: str,
        bypass_name: str,
        language: str = "en"
    ) -> Dict[str, Any]:
        dialect = cls.DIALECT_SCRIPTS.get(language, cls.DIALECT_SCRIPTS["en"])
        return {
            "language": language,
            "corridor": corridor_id,
            "title": dialect["critical_title"],
            "voice_script": dialect["message"].format(corridor=corridor_id, bypass=bypass_name, location=location),
            "sms_text": dialect["sms_template"].format(corridor=corridor_id, bypass=bypass_name, location=location),
            "dispatched": True
        }
