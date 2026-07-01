import { notFound } from "next/navigation";
import { stitchScreenNames, stitchScreens } from "./stitchScreens";

type StitchClonePageProps = {
  params: {
    "screen-name": string;
  };
};

export function generateStaticParams() {
  return stitchScreenNames.map((screenName) => ({ "screen-name": screenName }));
}

export function generateMetadata({ params }: StitchClonePageProps) {
  const screen = stitchScreens[params["screen-name"]];

  return {
    title: screen ? `${screen.title} | Stitch Clone` : "Stitch Clone"
  };
}

export default function StitchClonePage({ params }: StitchClonePageProps) {
  const screen = stitchScreens[params["screen-name"]];

  if (!screen) {
    notFound();
  }

  const ScreenComponent = screen.Component;

  return <ScreenComponent />;
}
