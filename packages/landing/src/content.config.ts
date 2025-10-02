import { defineCollection, z } from "astro:content";

const blogSchema = z.object({
	title: z.string(),
	author: z.string(),
	description: z.string(),
	excerpt: z.string().optional(),
	category: z.string().optional(),
	publishedAt: z.coerce.date(),
	updatedAt: z.coerce.date().optional(),
	readingTime: z.number().optional(),
	image: z.string().optional(),
});

export type BlogItem = z.infer<typeof blogSchema>;

const blog = defineCollection({
	type: "content",
	schema: blogSchema,
});

const jobSchema = z.object({
	title: z.string(),
	department: z.string(),
	location: z.string(),
	region: z.string(),
	type: z.string(),
	description: z.string(),
	requirements: z.array(z.string()),
	niceToHave: z.array(z.string()),
	published: z.boolean().default(true),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date().optional(),
});

export type JobItem = z.infer<typeof jobSchema>;

const jobs = defineCollection({
	type: "content",
	schema: jobSchema,
});

const integrationSchema = z.object({
	icon: z.string(),
	isBrand: z.boolean().default(false),
	version: z.string(),
	status: z.enum(["Completed", "In Progress", "Planned"]),
	title: z.string(),
	category: z.string(),
	description: z.string(),
	availability: z.string(),
});

export type IntegrationItem = z.infer<typeof integrationSchema>;

const integrations = defineCollection({
	type: "data",
	schema: integrationSchema,
});

const collections = { jobs, integrations, blog }

export { collections }
