import { z } from "zod";

// ProSelect XML item schema (validated after parsing)
export const proselectItemSchema = z.object({
  itemType: z.string(),
  description: z.string(),
  productName: z.string(),
  price: z.number(),
  quantity: z.number().int().min(1),
  extendedPrice: z.number(),
  tax: z.number().optional(),
});

export type ProselectItem = z.infer<typeof proselectItemSchema>;

export interface ProselectOrder {
  clientName: string;
  items: ProselectItem[];
  totalPrice: number;
  totalTax: number;
}

/**
 * Extract text content from an XML tag.
 * Simple regex-based extraction — does not need DOMParser.
 */
function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1]?.trim() ?? "";
}

function extractNum(xml: string, tag: string): number {
  return parseFloat(extractTag(xml, tag)) || 0;
}

/**
 * Parse ProSelect XML export into structured order data.
 * ProSelect XML format:
 *   <Client> → <Order> → <Ordered_Items> → <Ordered_Item>
 *   Each <Ordered_Item> has: ItemType, Description, Product_Name, Price, Quantity, Extended_Price, Tax, Images
 */
export function parseProSelectXml(xmlString: string): ProselectOrder {
  if (!xmlString.includes("<Ordered_Item") && !xmlString.includes("<ordered_item")) {
    throw new Error("No ordered items found in ProSelect XML");
  }

  // Extract client name
  const clientSection = extractTag(xmlString, "Client");
  const clientName = extractTag(clientSection || xmlString, "Name")
    || extractTag(clientSection || xmlString, "First_Name")
    || "Unknown Client";

  // Find all Ordered_Item blocks
  const itemRegex = /<Ordered_Item[^>]*>([\s\S]*?)<\/Ordered_Item>/gi;
  const itemMatches = [...xmlString.matchAll(itemRegex)];

  if (itemMatches.length === 0) {
    throw new Error("No ordered items found in ProSelect XML");
  }

  const items: ProselectItem[] = [];
  let totalPrice = 0;
  let totalTax = 0;

  for (const match of itemMatches) {
    const itemXml = match[1];

    const item: ProselectItem = {
      itemType: extractTag(itemXml, "ItemType") || extractTag(itemXml, "Item_Type") || "Unknown",
      description: extractTag(itemXml, "Description"),
      productName: extractTag(itemXml, "Product_Name") || extractTag(itemXml, "ProductName"),
      price: extractNum(itemXml, "Price"),
      quantity: Math.max(1, Math.round(extractNum(itemXml, "Quantity"))),
      extendedPrice: extractNum(itemXml, "Extended_Price") || extractNum(itemXml, "ExtendedPrice"),
      tax: extractNum(itemXml, "Tax") || undefined,
    };

    // If extended price is 0, calculate it
    if (item.extendedPrice === 0) {
      item.extendedPrice = item.price * item.quantity;
    }

    const validated = proselectItemSchema.safeParse(item);
    if (validated.success) {
      items.push(validated.data);
      totalPrice += validated.data.extendedPrice;
      totalTax += validated.data.tax ?? 0;
    }
  }

  if (items.length === 0) {
    throw new Error("No valid items found in ProSelect XML");
  }

  return { clientName, items, totalPrice, totalTax };
}
