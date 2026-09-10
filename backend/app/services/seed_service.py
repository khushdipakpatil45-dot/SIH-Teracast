from typing import Dict, Any, List

class SeedCorridorData:
    """
    Geospatial ground-truth seed fixtures for high-priority North Eastern Region corridors.
    """

    CORRIDORS: Dict[str, Dict[str, Any]] = {
        "NH-10": {
            "name": "Siliguri - Sevoke - Gangtok",
            "state_region": "Sikkim & West Bengal",
            "total_length_km": 114.5,
            "origin": {"name": "Siliguri Junction", "lat": 26.7271, "lon": 88.3953},
            "destination": {"name": "Gangtok (Tashiling)", "lat": 27.3389, "lon": 88.6065},
            "key_nodes": [
                {"chainage_km": 0.0, "name": "Siliguri", "lat": 26.7271, "lon": 88.3953},
                {"chainage_km": 21.2, "name": "Sevoke Bridge", "lat": 26.8837, "lon": 88.4688},
                {"chainage_km": 29.4, "name": "29th Mile (Teesta Gorge)", "lat": 26.9851, "lon": 88.4612, "critical_risk": True},
                {"chainage_km": 42.0, "name": "Teesta Bazaar", "lat": 27.0543, "lon": 88.4982},
                {"chainage_km": 52.5, "name": "Melli Junction", "lat": 27.0864, "lon": 88.4552},
                {"chainage_km": 75.8, "name": "Rangpo Border Post", "lat": 27.1764, "lon": 88.5298},
                {"chainage_km": 92.4, "name": "Singtam", "lat": 27.2341, "lon": 88.5028},
                {"chainage_km": 114.5, "name": "Gangtok Terminal", "lat": 27.3389, "lon": 88.6065}
            ],
            "bypass_route": {
                "name": "Siliguri -> Lava -> Algarah -> Kalimpong -> Gangtok Bypass",
                "distance_km": 142.8,
                "time_minutes": 275,
                "checkpoints": [
                    {"name": "Sevoke Army Post", "status": "OPEN"},
                    {"name": "Lava Pass Junction", "status": "OPEN"},
                    {"name": "Algarah Checkpoint", "status": "OPEN"},
                    {"name": "Rangpo Entry", "status": "CONTROLLED_ACCESS"}
                ],
                "coordinates": [
                    [88.3953, 26.7271],
                    [88.4688, 26.8837],
                    [88.6631, 27.0864],
                    [88.5833, 27.1210],
                    [88.4735, 27.0600],
                    [88.5298, 27.1764],
                    [88.6065, 27.3389]
                ]
            }
        },
        "NH-29": {
            "name": "Dimapur - Kohima - Imphal",
            "state_region": "Nagaland & Manipur",
            "total_length_km": 215.0,
            "origin": {"name": "Dimapur Hub", "lat": 25.9068, "lon": 93.7271},
            "destination": {"name": "Kohima Capital", "lat": 25.6751, "lon": 94.1086},
            "key_nodes": [
                {"chainage_km": 0.0, "name": "Dimapur", "lat": 25.9068, "lon": 93.7271},
                {"chainage_km": 14.5, "name": "Chumukedima", "lat": 25.7950, "lon": 93.7712},
                {"chainage_km": 28.0, "name": "Pagla Pahar (Creep Zone)", "lat": 25.8123, "lon": 93.8341, "critical_risk": True},
                {"chainage_km": 45.2, "name": "Medziphema", "lat": 25.7580, "lon": 93.8650},
                {"chainage_km": 68.4, "name": "Old KMC Sinking Site", "lat": 25.6841, "lon": 94.0812, "critical_risk": True},
                {"chainage_km": 74.0, "name": "Kohima", "lat": 25.6751, "lon": 94.1086}
            ],
            "bypass_route": {
                "name": "Dimapur -> Niuland -> Ghaspani -> Kohima Bypass",
                "distance_km": 96.4,
                "time_minutes": 210,
                "checkpoints": [
                    {"name": "Chumukedima Gate", "status": "OPEN"},
                    {"name": "Niuland Bridge", "status": "OPEN"},
                    {"name": "Jotsoma Entry", "status": "OPEN"}
                ],
                "coordinates": [
                    [93.7271, 25.9068],
                    [93.8100, 25.8500],
                    [93.9200, 25.7800],
                    [94.1086, 25.6751]
                ]
            }
        },
        "NH-6": {
            "name": "Guwahati - Shillong - Silchar",
            "state_region": "Meghalaya & Assam",
            "total_length_km": 308.0,
            "origin": {"name": "Guwahati Gateway", "lat": 26.1445, "lon": 91.7362},
            "destination": {"name": "Silchar Valley", "lat": 24.8333, "lon": 92.7789},
            "key_nodes": [
                {"chainage_km": 0.0, "name": "Guwahati", "lat": 26.1445, "lon": 91.7362},
                {"chainage_km": 52.0, "name": "Nongpoh", "lat": 25.9038, "lon": 91.8790},
                {"chainage_km": 99.0, "name": "Shillong", "lat": 25.5788, "lon": 91.8933},
                {"chainage_km": 164.0, "name": "Jowai (Jaintia Hills)", "lat": 25.4526, "lon": 92.2030},
                {"chainage_km": 242.0, "name": "Sonapur Tunnel Mudflow", "lat": 25.1098, "lon": 92.3650, "critical_risk": True},
                {"chainage_km": 308.0, "name": "Silchar", "lat": 24.8333, "lon": 92.7789}
            ],
            "bypass_route": {
                "name": "Shillong -> Dawki -> Amlarem -> Silchar Southern Link",
                "distance_km": 245.0,
                "time_minutes": 360,
                "checkpoints": [
                    {"name": "Pynursla Checkpost", "status": "OPEN"},
                    {"name": "Dawki Border Bridge", "status": "OPEN"},
                    {"name": "Badarpur Junction", "status": "OPEN"}
                ],
                "coordinates": [
                    [91.8933, 25.5788],
                    [91.9800, 25.3200],
                    [92.0200, 25.1800],
                    [92.4000, 24.9500],
                    [92.7789, 24.8333]
                ]
            }
        }
    }

    @classmethod
    def get_corridor(cls, corridor_id: str) -> Dict[str, Any]:
        return cls.CORRIDORS.get(corridor_id, cls.CORRIDORS["NH-10"])
