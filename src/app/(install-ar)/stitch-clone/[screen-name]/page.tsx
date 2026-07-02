import { notFound } from "next/navigation";
import { stitchScreenNames, stitchScreens } from "./stitchScreens";

type StitchClonePageProps = {
  params: Promise<{
    "screen-name": string;
  }>;
};

export function generateStaticParams() {
  return stitchScreenNames.map((screenName) => ({ "screen-name": screenName }));
}

export async function generateMetadata({ params }: StitchClonePageProps) {
  const { "screen-name": screenName } = await params;
  const screen = stitchScreens[screenName];

  return {
    title: screen ? `${screen.title} | Stitch Clone` : "Stitch Clone"
  };
}

export default async function StitchClonePage({ params }: StitchClonePageProps) {
  const { "screen-name": screenName } = await params;
  const screen = stitchScreens[screenName];

  if (!screen) {
    notFound();
  }

  const ScreenComponent = screen.Component;

  return <ScreenComponent />;
}
