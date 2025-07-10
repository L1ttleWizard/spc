"use client";

import React from 'react';

interface ContentSectionProps {
  title: string;
  children: React.ReactNode;
}

export default function ContentSection({ title, children }: ContentSectionProps) {
  return (
    <section className="mb-8">
      <h2 className="text-2xl font-bold mb-4">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {children}
      </div>
    </section>
  );
} 