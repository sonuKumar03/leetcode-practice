import argparse
import sys
import logging
from app.adapters import load_all_adapters
from app.adapters.registry import AdapterRegistry
from app.db.session import init_db
from app.services.sync_service import SyncPipelineService

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
load_all_adapters()

def main():
    parser = argparse.ArgumentParser(description="LeetCode Source Adapters Sync CLI")
    subparsers = parser.add_subparsers(dest="command")

    sync_parser = subparsers.add_parser("sync", help="Run sync pipeline")
    sync_parser.add_argument("--adapter", action="append", help="Run specific adapter(s)")
    sync_parser.add_argument("--list", action="store_true", help="List registered adapters")

    args = parser.parse_args()

    if args.command == "sync":
        if args.list:
            print("Registered Source Adapters:")
            for meta in AdapterRegistry.list_metadata():
                print(f"  - {meta['name']}: {meta['description']}")
            return

        init_db()
        service = SyncPipelineService()
        result = service.run_sync(adapter_names=args.adapter)
        print("\nSync Results:")
        for k, v in result.items():
            print(f"  {k}: {v}")
        if result.get("status") == "error":
            sys.exit(1)
    else:
        parser.print_help()

if __name__ == "__main__":
    main()
