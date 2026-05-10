import { Column, Img, Row, Text } from "react-email";

import { brandAssets } from "../tailwind.config";

export function LogoHeader() {
    return (
        <Row style={{ marginBottom: "24px" }}>
            <Column style={{ verticalAlign: "middle", width: "32px" }}>
                <Img
                    alt={brandAssets.logo.alt}
                    height={brandAssets.logo.height}
                    src={brandAssets.logo.src}
                    width={brandAssets.logo.width}
                />
            </Column>
            <Column style={{ paddingLeft: "8px", verticalAlign: "middle" }}>
                <Text
                    style={{
                        color: "#f5f0ff",
                        fontFamily:
                            "Geist Mono, SFMono-Regular, Menlo, Monaco, Consolas, monospace",
                        fontSize: "14px",
                        fontWeight: 500,
                        letterSpacing: "-0.3px",
                        margin: 0,
                    }}
                >
                    Emit Signal
                </Text>
            </Column>
        </Row>
    );
}
