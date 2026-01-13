import { defineCollection, z } from "astro:content";

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
	type: "content",
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
	type: "content",
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
	type: "data",
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
	type: "data",
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
	type: "data",
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
	type: "content",
	schema: sdkExampleSchema,
});

const useCaseSchema = z.object({
	title: z.string(),
	description: z.string(),
	audience: z.string().optional(),
});

export type UseCaseItem = z.infer<typeof useCaseSchema>;
const useCases = defineCollection({
	type: "data",
	schema: z.array(useCaseSchema),
});

export const collections = {
	"blog-posts": blogPosts,
	"legal-docs": legalDocs,
	faqs,
	testimonials,
	features,
	"sdk-examples": sdkExamples,
	"use-cases": useCases,
};
