import * as React from "react";

import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export interface DeadlineReminderItem {
  summary: string;
  category: string;
}

interface DeadlineReminderEmailProps {
  siteName: string;
  siteUrl: string;
  recipientName: string;
  items: DeadlineReminderItem[];
}

export const DeadlineReminderEmail = ({
  siteName,
  siteUrl,
  recipientName,
  items,
}: DeadlineReminderEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>{`${items.length} item${items.length === 1 ? "" : "s"} due today`}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>STARTWEB</Text>
        <Heading style={h1}>Due today</Heading>
        <Text style={text}>Hi {recipientName || "there"},</Text>
        <Text style={text}>
          A quick heads-up from {siteName} — the following{" "}
          {items.length === 1 ? "item is" : "items are"} due today:
        </Text>
        <Section style={list}>
          {items.map((item, index) => (
            <Text key={index} style={listItem}>
              <span style={category}>{item.category}</span>
              <br />
              {item.summary}
            </Text>
          ))}
        </Section>
        <Text style={footer}>
          You're receiving this because you're a contact on an account with{" "}
          <Link href={siteUrl} style={{ color: "inherit" }}>
            {siteName}
          </Link>
          . Reach out if anything here needs a change.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default DeadlineReminderEmail;

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
  margin: "0 0 16px",
};
const list = {
  margin: "0 0 16px",
};
const listItem = {
  fontSize: "14px",
  color: "#0B1220",
  lineHeight: "1.4",
  margin: "0 0 14px",
  paddingLeft: "12px",
  borderLeft: "3px solid #164BFA",
};
const category = {
  fontSize: "11px",
  fontWeight: 700 as const,
  letterSpacing: "0.06em",
  textTransform: "uppercase" as const,
  color: "#164BFA",
};
const footer = { fontSize: "12px", color: "#999999", margin: "30px 0 0" };
