import { defineCollection } from "astro:content";
import { glob } from "astro/loaders";
import { z } from "astro/zod";

const blogSchema = z.object({
	title: z.string(),
	author: z.string(),
	description: z.string(),
	excerpt: z.string().optional(),
	category: z.string().optional(),
	tags: z.array(z.string()).optional(),
	publishedAt: z.coerce.date(),
	updatedAt: z.coerce.date().optional(),
	image: z.string().optional(),
});

export type BlogItem = z.infer<typeof blogSchema>;
const blogPosts = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/blog-posts" }),
	schema: blogSchema,
});

const legalSchema = z.object({
	title: z.string(),
	description: z.string(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
	version: z.string(),
});

export type LegalItem = z.infer<typeof legalSchema>;
const legalDocs = defineCollection({
	loader: glob({ pattern: "**/*.{md,mdx}", base: "src/content/legal-docs" }),
	schema: legalSchema,
});

const faqSchema = z.object({
	question: z.string(),
	answer: z.string(),
	order: z.number(),
	featured: z.boolean().default(false),
});

export type FAQItem = z.infer<typeof faqSchema>;
const faqs = defineCollection({
	loader: glob({ pattern: "**/*.json", base: "src/content/faqs" }),
	schema: z.array(faqSchema),
});

const testimonialSchema = z.object({
	quote: z.string(),
	author: z.string(),
	title: z.string(),
	company: z.string(),
	avatar: z.string().optional(),
	companyLogo: z.string().optional(),
	rating: z.number().optional(),
	order: z.number(),
	featured: z.boolean().default(false),
});

export type TestimonialItem = z.infer<typeof testimonialSchema>;
const testimonials = defineCollection({
	loader: glob({ pattern: "**/*.json", base: "src/content/testimonials" }),
	schema: z.array(testimonialSchema),
});

const featureSchema = z.object({
	title: z.string(),
	description: z.string(),
	icon: z.string(),
	order: z.number(),
	featured: z.boolean().default(false),
});

export type FeatureItem = z.infer<typeof featureSchema>;
const features = defineCollection({
	loader: glob({ pattern: "**/*.json", base: "src/content/features" }),
	schema: z.array(featureSchema),
});

const sdkExampleSchema = z.object({
	name: z.string(),
	language: z.string(),
	filename: z.string(),
	extension: z.string(),
	githubUrl: z.string(),
	order: z.number(),
});

export type SDKExampleItem = z.infer<typeof sdkExampleSchema>;
const sdkExamples = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "src/content/sdk-examples" }),
	schema: sdkExampleSchema,
});

const useCaseSchema = z.object({
	title: z.string(),
	description: z.string(),
	audience: z.string().optional(),
});

export type UseCaseItem = z.infer<typeof useCaseSchema>;
const useCases = defineCollection({
	loader: glob({ pattern: "**/*.json", base: "src/content/use-cases" }),
	schema: z.array(useCaseSchema),
});

const changelogSchema = z.object({
	title: z.string(),
	description: z.string(),
	publishedAt: z.coerce.date(),
	version: z.string().optional(),
	tags: z.array(z.enum(["new", "improvement", "fix", "breaking"])).optional(),
	image: z.string().optional(),
});

export type ChangelogItem = z.infer<typeof changelogSchema>;
const changelog = defineCollection({
	loader: glob({ pattern: "**/*.md", base: "src/content/changelog" }),
	schema: changelogSchema,
});

export const collections = {
	"blog-posts": blogPosts,
	"legal-docs": legalDocs,
	faqs,
	testimonials,
	features,
	"sdk-examples": sdkExamples,
	"use-cases": useCases,
	changelog,
};
