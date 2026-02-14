from __future__ import annotations

import json
from datetime import date
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction

from blog.models import HighlightItem, HighlightStage, SocialFriend, TimelineNode, TravelPlace


def parse_date(value):
    if not value:
        return None
    if isinstance(value, date):
        return value
    return date.fromisoformat(str(value))


class Command(BaseCommand):
    help = "Import timeline/travel/social/highlight data from JSON file"

    def add_arguments(self, parser):
        parser.add_argument("source", help="Path to JSON file")
        parser.add_argument("--dry-run", action="store_true", default=False)
        parser.add_argument("--truncate", action="store_true", default=False)

    def handle(self, *args, **options):
        source = Path(options["source"])
        dry_run = options["dry_run"]
        truncate = options["truncate"]

        if not source.exists():
            raise CommandError(f"File not found: {source}")

        payload = json.loads(source.read_text(encoding="utf-8"))

        timeline_nodes = payload.get("timeline_nodes", [])
        travel_places = payload.get("travel_places", [])
        social_friends = payload.get("social_friends", [])
        highlight_stages = payload.get("highlight_stages", [])

        self.stdout.write(
            f"Loaded: timeline={len(timeline_nodes)}, travel={len(travel_places)}, social={len(social_friends)}, highlights={len(highlight_stages)}"
        )

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry-run mode: no database changes"))
            return

        with transaction.atomic():
            if truncate:
                HighlightItem.objects.all().delete()
                HighlightStage.objects.all().delete()
                TimelineNode.objects.all().delete()
                TravelPlace.objects.all().delete()
                SocialFriend.objects.all().delete()

            timeline_count = 0
            for index, node in enumerate(timeline_nodes):
                start_date = parse_date(node.get("start_date"))
                if not start_date:
                    raise CommandError(f"timeline_nodes[{index}] missing start_date")

                defaults = {
                    "description": node.get("description", ""),
                    "end_date": parse_date(node.get("end_date")),
                    "type": node.get("type", TimelineNode.NodeType.LEARNING),
                    "impact": node.get("impact", TimelineNode.Impact.MEDIUM),
                    "phase": node.get("phase", ""),
                    "tags": node.get("tags", []),
                    "cover": node.get("cover", ""),
                    "links": node.get("links", []),
                    "sort_order": int(node.get("sort_order", index)),
                }
                TimelineNode.objects.update_or_create(
                    title=node["title"],
                    start_date=start_date,
                    defaults=defaults,
                )
                timeline_count += 1

            travel_count = 0
            for index, place in enumerate(travel_places):
                TravelPlace.objects.update_or_create(
                    province=place["province"],
                    city=place["city"],
                    defaults={
                        "notes": place.get("notes", ""),
                        "visited_at": parse_date(place.get("visited_at")),
                        "latitude": place.get("latitude"),
                        "longitude": place.get("longitude"),
                        "cover": place.get("cover", ""),
                        "sort_order": int(place.get("sort_order", index)),
                    },
                )
                travel_count += 1

            social_count = 0
            for index, friend in enumerate(social_friends):
                stage_key = friend.get("stage_key", SocialFriend.StageKey.CAREER)
                valid_stage_keys = {choice[0] for choice in SocialFriend.StageKey.choices}
                if stage_key not in valid_stage_keys:
                    stage_key = SocialFriend.StageKey.CAREER

                SocialFriend.objects.update_or_create(
                    public_label=friend["public_label"],
                    defaults={
                        "name": friend.get("name", friend["public_label"]),
                        "relation": friend.get("relation", ""),
                        "stage_key": stage_key,
                        "avatar": friend.get("avatar", ""),
                        "profile_url": friend.get("profile_url", ""),
                        "is_public": bool(friend.get("is_public", True)),
                        "sort_order": int(friend.get("sort_order", index)),
                    },
                )
                social_count += 1

            stage_count = 0
            item_count = 0
            for stage_index, stage_data in enumerate(highlight_stages):
                stage, _ = HighlightStage.objects.update_or_create(
                    title=stage_data["title"],
                    start_date=parse_date(stage_data.get("start_date")),
                    defaults={
                        "description": stage_data.get("description", ""),
                        "end_date": parse_date(stage_data.get("end_date")),
                        "sort_order": int(stage_data.get("sort_order", stage_index)),
                    },
                )
                stage_count += 1

                for item_index, item_data in enumerate(stage_data.get("items", [])):
                    HighlightItem.objects.update_or_create(
                        stage=stage,
                        title=item_data["title"],
                        defaults={
                            "description": item_data.get("description", ""),
                            "achieved_at": parse_date(item_data.get("achieved_at")),
                            "sort_order": int(item_data.get("sort_order", item_index)),
                        },
                    )
                    item_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Imported timeline={timeline_count}, travel={travel_count}, social={social_count}, highlight_stages={stage_count}, highlight_items={item_count}"
            )
        )
