import { Body, Container, Head, Heading, Html, Img, Link, Section, Text } from "react-email";

interface PlaidVerifyIdentityEmailProps {
    validationCode?: string;
}

const baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "";

export const PlaidVerifyIdentityEmail = ({ validationCode }: PlaidVerifyIdentityEmailProps) => (
    <Html>
        <Head />
        <Body style={main}>
            <Container style={container}>
                <Img
                    alt="Plaid"
                    height="88"
                    src={`${baseUrl}/static/plaid-logo.png`}
                    style={logo}
                    width="212"
                />
                <Text style={tertiary}>Verify Your Identity</Text>
                <Heading style={secondary}>
                    Enter the following code to finish linking Venmo.
                </Heading>
                <Section style={codeContainer}>
                    <Text style={code}>{validationCode}</Text>
                </Section>
                <Text style={paragraph}>Not expecting this email?</Text>
                <Text style={paragraph}>
                    Contact{" "}
                    <Link href="mailto:login@plaid.com" style={link}>
                        login@plaid.com
                    </Link>{" "}
                    if you did not request this code.
                </Text>
            </Container>
            <Text style={footer}>Securely powered by Plaid.</Text>
        </Body>
    </Html>
);

PlaidVerifyIdentityEmail.PreviewProps = {
    validationCode: "144833",
} as PlaidVerifyIdentityEmailProps;

export default PlaidVerifyIdentityEmail;

const main = {
    backgroundColor: "#ffffff",
    fontFamily: "HelveticaNeue,Helvetica,Arial,sans-serif",
};

const container = {
    backgroundColor: "#ffffff",
    border: "1px solid #eee",
    borderRadius: "5px",
    boxShadow: "0 5px 10px rgba(20,50,70,.2)",
    margin: "0 auto",
    marginTop: "20px",
    maxWidth: "360px",
    padding: "68px 0 130px",
};

const logo = {
    margin: "0 auto",
};

const tertiary = {
    color: "#0a85ea",
    fontFamily: "HelveticaNeue,Helvetica,Arial,sans-serif",
    fontSize: "11px",
    fontWeight: 700,
    height: "16px",
    letterSpacing: "0",
    lineHeight: "16px",
    margin: "16px 8px 8px 8px",
    textAlign: "center" as const,
    textTransform: "uppercase" as const,
};

const secondary = {
    color: "#000",
    display: "inline-block",
    fontFamily: "HelveticaNeue-Medium,Helvetica,Arial,sans-serif",
    fontSize: "20px",
    fontWeight: 500,
    lineHeight: "24px",
    marginBottom: "0",
    marginTop: "0",
    textAlign: "center" as const,
};

const codeContainer = {
    background: "rgba(0,0,0,.05)",
    borderRadius: "4px",
    margin: "16px auto 14px",
    verticalAlign: "middle",
    width: "280px",
};

const code = {
    color: "#000",
    display: "inline-block",
    fontFamily: "HelveticaNeue-Bold",
    fontSize: "32px",
    fontWeight: 700,
    letterSpacing: "6px",
    lineHeight: "40px",
    margin: "0 auto",
    paddingBottom: "8px",
    paddingTop: "8px",
    textAlign: "center" as const,
    width: "100%",
};

const paragraph = {
    color: "#444",
    fontFamily: "HelveticaNeue,Helvetica,Arial,sans-serif",
    fontSize: "15px",
    letterSpacing: "0",
    lineHeight: "23px",
    margin: "0",
    padding: "0 40px",
    textAlign: "center" as const,
};

const link = {
    color: "#444",
    textDecoration: "underline",
};

const footer = {
    color: "#000",
    fontFamily: "HelveticaNeue,Helvetica,Arial,sans-serif",
    fontSize: "12px",
    fontWeight: 800,
    letterSpacing: "0",
    lineHeight: "23px",
    margin: "0",
    marginTop: "20px",
    textAlign: "center" as const,
    textTransform: "uppercase" as const,
};
