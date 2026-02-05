import { Composition } from "remotion";
import { BlueprintMachine } from "./compositions/BlueprintMachine";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="BlueprintMachine"
        component={BlueprintMachine}
        durationInFrames={950} // ~27 seconds at 30fps
        fps={30}
        width={1920}
        height={1080}
      />
      <Composition
        id="BlueprintMachine-Square"
        component={BlueprintMachine}
        durationInFrames={950}
        fps={30}
        width={1080}
        height={1080}
      />
    </>
  );
};
