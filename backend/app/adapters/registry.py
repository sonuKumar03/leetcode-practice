from typing import Dict, Type, List, Any, Optional
from app.adapters.base import BaseSourceAdapter


class AdapterRegistry:
    _registry: Dict[str, Type[BaseSourceAdapter]] = {}

    @classmethod
    def register(cls, adapter_cls: Type[BaseSourceAdapter]) -> Type[BaseSourceAdapter]:
        cls._registry[adapter_cls.name] = adapter_cls
        return adapter_cls

    @classmethod
    def get(cls, name: str) -> Optional[BaseSourceAdapter]:
        adapter_cls = cls._registry.get(name)
        return adapter_cls() if adapter_cls else None

    @classmethod
    def get_all(cls) -> Dict[str, BaseSourceAdapter]:
        return {name: adapter_cls() for name, adapter_cls in cls._registry.items()}

    @classmethod
    def list_metadata(cls) -> List[Dict[str, Any]]:
        return [
            {
                "name": name,
                "description": adapter_cls.description,
                "enabled_by_default": adapter_cls.enabled_by_default,
            }
            for name, adapter_cls in cls._registry.items()
        ]

    @classmethod
    def clear(cls) -> None:
        cls._registry.clear()
