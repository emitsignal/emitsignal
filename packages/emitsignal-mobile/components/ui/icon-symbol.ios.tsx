import { SymbolView, SymbolViewProps, SymbolWeight } from "expo-symbols";
import { StyleProp, ViewStyle } from "react-native";

export function IconSymbol({
    color,
    name,
    size = 24,
    style,
    weight = "regular",
}: {
    color: string;
    name: SymbolViewProps["name"];
    size?: number;
    style?: StyleProp<ViewStyle>;
    weight?: SymbolWeight;
}) {
    return (
        <SymbolView
            name={name}
            resizeMode="scaleAspectFit"
            style={[
                {
                    height: size,
                    width: size,
                },
                style,
            ]}
            tintColor={color}
            weight={weight}
        />
    );
}
