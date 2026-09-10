import * as React from "react";

import { Body, Container, Head, Heading, Html, Preview, Text } from "@react-email/components";

interface ReauthenticationEmailProps {
  token: string;
}

export const ReauthenticationEmail = ({ token }: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your verification code</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>STARTWEB</Text>
        <Heading style={h1}>Confirm reauthentication</Heading>
        <Text style={text}>Use the code below to confirm your identity:</Text>
        <Text style={codeStyle}>{token}</Text>
        <Text style={footer}>
          This code will expire shortly. If you didn't request this, you can safely ignore this
          email.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default ReauthenticationEmail;

const main = {
  backgroundColor: "#F7F8FA",
  fontFamily: "Inter, -apple-system, Segoe UI, Arial, sans-serif",
  padding: "32px 0",
};
const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #E5E7EB",
  borderRadius: "12px",
  padding: "32px 36px",
  maxWidth: "520px",
};
const brand = {
  fontSize: "13px",
  fontWeight: 700 as const,
  letterSpacing: "0.18em",
  color: "#164BFA",
  margin: "0 0 24px",
};
const h1 = {
  fontSize: "22px",
  fontWeight: "bold" as const,
  color: "#0B1220",
  margin: "0 0 16px",
};
const text = {
  fontSize: "14px",
  color: "#55575d",
  lineHeight: "1.5",
  margin: "0 0 25px",
};
const codeStyle = {
  fontFamily: "Courier, monospace",
  fontSize: "22px",
  fontWeight: "bold" as const,
  color: "#000000",
  margin: "0 0 30px",
};
const footer = { fontSize: "12px", color: "#999999", margin: "30px 0 0" };
