import type { Category, CategoryTree } from "@/types/product";

interface CategoryRaw extends Category {
  parent?: {
    node?: {
      databaseId?: number;
    };
  };
}

function normalizeCategory(
  cat: CategoryRaw,
): Category & { parentId: number | null } {
  return {
    ...cat,
    parentId: cat.parent?.node?.databaseId ?? null,
  };
}

export function buildCategoryTree(categories: CategoryRaw[]): CategoryTree[] {
  const normalized = categories.map(normalizeCategory);
  const categoryMap = new Map<number, CategoryTree>();
  const roots: CategoryTree[] = [];

  normalized.forEach((cat) => {
    categoryMap.set(cat.databaseId, { ...cat, children: [] });
  });

  normalized.forEach((cat) => {
    const node = categoryMap.get(cat.databaseId)!;
    if (cat.parentId) {
      const parent = categoryMap.get(cat.parentId);
      if (parent) {
        parent.children.push(node);
      } else {
        roots.push(node);
      }
    } else {
      roots.push(node);
    }
  });

  return roots;
}

export function getAllDescendantIds(category: CategoryTree): number[] {
  const ids: number[] = [category.databaseId];
  category.children.forEach((child) => {
    ids.push(...getAllDescendantIds(child));
  });
  return ids;
}

export function findCategoryBySlug(
  categories: CategoryTree[],
  slug: string,
): CategoryTree | undefined {
  for (const cat of categories) {
    if (cat.slug === slug) return cat;
    const found = findCategoryBySlug(cat.children, slug);
    if (found) return found;
  }
  return undefined;
}

export function getCategoryBreadcrumb(
  categories: CategoryTree[],
  slug: string,
): CategoryTree[] {
  for (const cat of categories) {
    if (cat.slug === slug) return [cat];
    const path = getCategoryBreadcrumb(cat.children, slug);
    if (path.length > 0) return [cat, ...path];
  }
  return [];
}
