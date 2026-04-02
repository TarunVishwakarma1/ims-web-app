import { faker } from "@faker-js/faker";

export type InventoryStatus = "In Stock" | "Low Stock" | "Out of Stock";

export interface InventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  status: InventoryStatus;
  lastUpdated: string;
}

const generateMockData = (): InventoryItem[] => {
  return Array.from({ length: 50 }, () => {
    const stock = faker.number.int({ min: 0, max: 200 });
    let status: InventoryStatus = "In Stock";
    if (stock === 0) status = "Out of Stock";
    else if (stock < 20) status = "Low Stock";

    return {
      id: faker.string.uuid(),
      sku: faker.string.alphanumeric({ length: 8, casing: "upper" }),
      name: faker.commerce.productName(),
      category: faker.commerce.department(),
      price: Number.parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
      stock,
      status,
      lastUpdated: faker.date.recent({ days: 30 }).toISOString(),
    };
  });
};

export const mockInventoryData = generateMockData();
