"use client";

import { useEffect, useState } from "react";

export interface CategoryItem {
  id: string;
  name: string;
  type: "INCOME" | "EXPENSE";
  icon: string;
  color: string;
}

export interface TagItem {
  id: string;
  name: string;
}

export function useCategories(type?: "INCOME" | "EXPENSE") {
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const url = type ? `/api/categories?type=${type}` : "/api/categories";
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setCategories(data);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [type]);

  return { categories, loading };
}

export function useTags() {
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/tags")
      .then((res) => res.json())
      .then(setTags)
      .finally(() => setLoading(false));
  }, []);

  return { tags, loading, setTags };
}
