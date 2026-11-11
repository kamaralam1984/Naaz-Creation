import { Container } from "@/components/ui/Container";
import { PageHero } from "@/components/layout/PageHero";
import { EnquiryForm } from "@/components/content/EnquiryForm";
import { JsonLd, breadcrumbJsonLd, pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ title: "Bulk Order Enquiry", description: "Wholesale and bulk quantities of handcrafted décor, copper ware and Dokra brass for events, retail and hospitality.", path: "/gifting/bulk" });

export default function Bulk() {
  return (
    <>
      <JsonLd data={breadcrumbJsonLd([{ name: "Home", path: "/" }, { name: "Gifting", path: "/gifting" }, { name: "Bulk orders", path: "/gifting/bulk" }])} />
      <PageHero eyebrow="Bulk orders" title="Larger quantities, same hands." intro="Planning an event, a store or a hospitality project? Handmade pieces take lead time — tell us what you need and when." />
      <Container className="max-w-3xl py-20"><EnquiryForm kind="bulk" submitLabel="Send bulk enquiry" messageLabel="Details of your requirement" /></Container>
    </>
  );
}
