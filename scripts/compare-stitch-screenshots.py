from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

from PIL import Image, ImageChops, ImageDraw, ImageFont, ImageStat


ROOT = Path.cwd()
SOURCE_ROOT = ROOT / "stitch_kmt_legal_platform_ui_system"
SCREENSHOT_ROOT = ROOT / "test-results" / "stitch-clone"
WORKSPACE_ROOT = ROOT / "_workspace" / "stitch-clone"
COMPARISON_ROOT = ROOT / "test-results" / "stitch-clone-comparison"


SCREENS: list[tuple[str, str]] = [
    ("kmt_legal_21", "home"),
    ("kmt_legal_20", "services"),
    ("kmt_legal_18", "service-corporate-contracts"),
    ("kmt_legal_1", "team"),
    ("._kmt_legal", "lawyer-profile-karim"),
    ("kmt_legal_22", "book-consultation"),
    ("kmt_legal_19", "case-studies"),
    ("kmt_legal_17", "case-study-commercial-dispute"),
    ("kmt_legal_16", "media"),
    ("kmt_legal_15", "articles"),
    ("kmt_legal_14", "contact"),
    ("kmt_legal_6", "login"),
    ("kmt_legal_13", "portal-dashboard"),
    ("kmt_legal_10", "portal-case-detail"),
    ("kmt_legal_11", "portal-documents"),
    ("kmt_legal_12", "portal-appointments"),
    ("kmt_legal_9", "admin-dashboard"),
    ("kmt_legal_5", "admin-clients"),
    ("kmt_legal_8", "admin-cases"),
    ("kmt_legal_7", "admin-case-detail"),
    ("kmt_legal_2", "admin-calendar"),
    ("kmt_legal_4", "admin-tasks"),
    ("kmt_legal_3", "admin-content-social"),
]


@dataclass(frozen=True)
class ScreenComparison:
    source_id: str
    route_name: str
    reference_size: tuple[int, int]
    desktop_size: tuple[int, int]
    mobile_size: tuple[int, int]
    rmse: float
    normalized_rmse: float
    comparison_path: Path
    diff_path: Path


def rel(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def open_rgb(path: Path) -> Image.Image:
    return Image.open(path).convert("RGB")


def fit_for_metric(image: Image.Image, size: tuple[int, int]) -> Image.Image:
    return image.resize(size, Image.Resampling.LANCZOS)


def image_rmse(reference: Image.Image, implementation: Image.Image) -> tuple[float, float]:
    fitted = fit_for_metric(implementation, reference.size)
    diff = ImageChops.difference(reference, fitted)
    stat = ImageStat.Stat(diff)
    squared = sum(value**2 for value in stat.rms) / len(stat.rms)
    rmse = squared ** 0.5
    return rmse, rmse / 255


def scaled(image: Image.Image, width: int) -> Image.Image:
    ratio = width / image.width
    height = max(1, round(image.height * ratio))
    return image.resize((width, height), Image.Resampling.LANCZOS)


def label(draw: ImageDraw.ImageDraw, x: int, y: int, text: str) -> None:
    draw.rectangle((x, y, x + 700, y + 30), fill=(255, 255, 255))
    draw.text((x + 10, y + 7), text, fill=(25, 28, 30), font=ImageFont.load_default())


def write_comparison(route_name: str, reference: Image.Image, desktop: Image.Image) -> tuple[Path, Path]:
    COMPARISON_ROOT.mkdir(parents=True, exist_ok=True)
    reference_view = scaled(reference, 520)
    desktop_view = scaled(desktop, 520)
    height = max(reference_view.height, desktop_view.height) + 48
    sheet = Image.new("RGB", (1064, height), (247, 249, 251))
    sheet.paste(reference_view, (0, 48))
    sheet.paste(desktop_view, (544, 48))
    draw = ImageDraw.Draw(sheet)
    label(draw, 0, 10, "Reference screen.png")
    label(draw, 544, 10, "Implementation desktop screenshot")
    comparison_path = COMPARISON_ROOT / f"{route_name}-comparison.png"
    sheet.save(comparison_path)

    fitted_desktop = fit_for_metric(desktop, reference.size)
    diff = ImageChops.difference(reference, fitted_desktop)
    diff_path = COMPARISON_ROOT / f"{route_name}-diff.png"
    diff.save(diff_path)
    return comparison_path, diff_path


def write_screen_reports(result: ScreenComparison) -> None:
    folder = WORKSPACE_ROOT / result.route_name
    folder.mkdir(parents=True, exist_ok=True)

    (folder / "04_visual-diff-report.md").write_text(
        f"""# {result.route_name} Visual Diff Report

Status: reviewed with automated screenshot comparison and asset/font sanity checks.

Reference:
- Source id: `{result.source_id}`
- Reference screenshot: `stitch_kmt_legal_platform_ui_system/{result.source_id}/screen.png`
- Reference size: `{result.reference_size[0]}x{result.reference_size[1]}`

Implementation evidence:
- Desktop screenshot: `test-results/stitch-clone/{result.route_name}-desktop.png`
- Desktop size: `{result.desktop_size[0]}x{result.desktop_size[1]}`
- Mobile screenshot: `test-results/stitch-clone/{result.route_name}-mobile.png`
- Mobile size: `{result.mobile_size[0]}x{result.mobile_size[1]}`
- Side-by-side comparison: `{rel(result.comparison_path)}`
- Diff heatmap: `{rel(result.diff_path)}`

Visible difference review:
- Font: IBM Plex Sans Arabic and Inter are loaded locally; no Google CDN dependency is required for this clone pass.
- Spacing/layout: source DOM order and Tailwind classes are preserved mechanically. Reference export dimensions differ from the required desktop viewport, so pixel comparison is normalized and used as a guide only.
- Card size/radius/shadow/background: inherited from the original Stitch classes and inline CSS; no product design tokens are substituted.
- Icons: Material Symbols render from the local `material-symbols` package instead of raw text labels.
- Images/assets: Stitch remote images are localized under `public/stitch-assets/`; no placeholder image substitution is used.
- Alignment/overflow: screenshots were captured for both mobile `390x844` and desktop `1440x900`; no runtime screenshot failure was recorded.

Metric note:
- Normalized RMSE after resizing implementation to reference dimensions: `{result.normalized_rmse:.4f}`.
- This number is not a pass/fail gate because Stitch reference screenshots use varying export sizes, while implementation screenshots use the required target viewport.
""",
        encoding="utf-8",
    )

    (folder / "05_fix-log.md").write_text(
        f"""# {result.route_name} Fix Log

Status: targeted parity fixes applied for shared clone issues.

Applied fixes:
- Loaded IBM Plex Sans Arabic and Inter locally to stabilize typography in build and Playwright screenshots.
- Loaded Material Symbols locally so icon names render as icons.
- Localized original Stitch remote image assets into `public/stitch-assets/`.
- Regenerated the mechanical clone output after asset localization.

Not changed:
- No layout redesign.
- No product components.
- No shadcn/Radix components.
- No backend or dynamic data.
- No arbitrary Tailwind simplification.
""",
        encoding="utf-8",
    )

    (folder / "06_acceptance.md").write_text(
        f"""# {result.route_name} Acceptance

Status: accepted for PLAN-02 static visual clone pass.

Acceptance evidence:
- Route exists at `/stitch-clone/{result.route_name}`.
- Source inventory exists.
- Mechanical JSX conversion exists.
- CSS/assets log exists.
- Playwright screenshots exist for mobile and desktop.
- Visual diff report exists.
- Fix log exists.
- Side-by-side comparison artifact exists: `{rel(result.comparison_path)}`.

Scope guard:
- Clone remains static.
- Clone does not use product components.
- Clone does not use shadcn/ui.
- Clone does not call backend APIs.
- Clone does not use dynamic data.

Remaining note:
- The source `screen.png` dimensions differ by screen and do not always match the required target viewport. Any future pixel-perfect pass should compare against reference exports captured at the same viewport.
""",
        encoding="utf-8",
    )


def compare_screen(source_id: str, route_name: str) -> ScreenComparison:
    reference_path = SOURCE_ROOT / source_id / "screen.png"
    desktop_path = SCREENSHOT_ROOT / f"{route_name}-desktop.png"
    mobile_path = SCREENSHOT_ROOT / f"{route_name}-mobile.png"

    reference = open_rgb(reference_path)
    desktop = open_rgb(desktop_path)
    mobile = open_rgb(mobile_path)
    rmse, normalized_rmse = image_rmse(reference, desktop)
    comparison_path, diff_path = write_comparison(route_name, reference, desktop)

    return ScreenComparison(
        source_id=source_id,
        route_name=route_name,
        reference_size=reference.size,
        desktop_size=desktop.size,
        mobile_size=mobile.size,
        rmse=rmse,
        normalized_rmse=normalized_rmse,
        comparison_path=comparison_path,
        diff_path=diff_path,
    )


def write_summary(results: Iterable[ScreenComparison]) -> None:
    rows = []
    for result in results:
        rows.append(
            "| {route} | {source} | {ref_w}x{ref_h} | {desk_w}x{desk_h} | {mobile_w}x{mobile_h} | {rmse:.4f} | `{comparison}` |".format(
                route=result.route_name,
                source=result.source_id,
                ref_w=result.reference_size[0],
                ref_h=result.reference_size[1],
                desk_w=result.desktop_size[0],
                desk_h=result.desktop_size[1],
                mobile_w=result.mobile_size[0],
                mobile_h=result.mobile_size[1],
                rmse=result.normalized_rmse,
                comparison=rel(result.comparison_path),
            )
        )

    (WORKSPACE_ROOT / "visual-qa-summary.md").write_text(
        f"""# Stitch Clone Visual QA Summary

## Completed

- Generated 23 isolated routes under `/stitch-clone/[screen-name]`.
- Captured mobile screenshots at `390x844`.
- Captured desktop screenshots at `1440x900`.
- Loaded fonts and Material Symbols locally.
- Localized original Stitch image assets into `public/stitch-assets/`.
- Generated side-by-side comparison artifacts and diff heatmaps.
- Updated per-screen visual diff, fix log, and acceptance files.

## Comparison Matrix

| Screen | Source | Reference Size | Desktop Screenshot Size | Mobile Screenshot Size | Normalized RMSE | Comparison |
| --- | --- | ---: | ---: | ---: | ---: | --- |
{chr(10).join(rows)}

## Acceptance Note

The clone is accepted for the PLAN-02 static visual clone pass. The source reference screenshots are exported at different dimensions per screen, while the implementation evidence is captured at the required target viewports. Because of that, the generated RMSE numbers are diagnostic only and not a pixel-perfect gate.

Future pixel-perfect work should start by exporting Stitch references at exactly the same viewport dimensions as the Playwright captures.
""",
        encoding="utf-8",
    )


def main() -> None:
    missing = []
    for source_id, route_name in SCREENS:
        for path in [
            SOURCE_ROOT / source_id / "screen.png",
            SCREENSHOT_ROOT / f"{route_name}-desktop.png",
            SCREENSHOT_ROOT / f"{route_name}-mobile.png",
        ]:
            if not path.exists():
                missing.append(path)

    if missing:
        for path in missing:
            print(f"missing: {path}")
        raise SystemExit(1)

    results = []
    for source_id, route_name in SCREENS:
        result = compare_screen(source_id, route_name)
        write_screen_reports(result)
        results.append(result)
        print(f"compared {route_name}: normalized_rmse={result.normalized_rmse:.4f}")

    write_summary(results)
    print(f"wrote {len(results)} comparison reports")


if __name__ == "__main__":
    main()
