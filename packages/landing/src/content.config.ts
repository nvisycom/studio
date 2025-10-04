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

const legalSchema = z.object({
	title: z.string(),
	description: z.string(),
	createdAt: z.coerce.date(),
	updatedAt: z.coerce.date(),
	version: z.string(),
});

export type LegalItem = z.infer<typeof legalSchema>;
const legal = defineCollection({
	type: "content",
	schema: legalSchema,
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

const roadmapSchema = z.object({
	id: z.string(),
	title: z.string(),
	description: z.string(),
	quarter: z.string(),
	status: z.enum(["completed", "in-progress", "planned"]),
	category: z.string(),
	priority: z.enum(["high", "medium", "low"]),
	progress: z.number().optional(),
	githubIssue: z.string().optional(),
});

export type RoadmapItem = z.infer<typeof roadmapSchema>;
const roadmap = defineCollection({
	type: "data",
	schema: z.array(roadmapSchema),
});

const comparisonSchema = z.object({
	slug: z.string(),
	title: z.string(),
	competitor: z.object({
		name: z.string(),
		description: z.string(),
		logo: z.string(),
		website: z.string(),
		founded: z.string(),
		headquarters: z.string(),
	}),
	overview: z.object({
		nvisy: z.object({
			strengths: z.array(z.string()),
			weaknesses: z.array(z.string()),
		}),
		competitor: z.object({
			strengths: z.array(z.string()),
			weaknesses: z.array(z.string()),
		}),
	}),
	features: z.array(
		z.object({
			name: z.string(),
			nvisy: z.union([z.boolean(), z.string()]),
			competitor: z.union([z.boolean(), z.string()]),
		}),
	),
	pricing: z.object({
		nvisy: z.object({
			starter: z.object({
				price: z.union([z.number(), z.string()]),
				features: z.array(z.string()),
			}),
			pro: z.object({
				price: z.union([z.number(), z.string()]),
				features: z.array(z.string()),
			}),
			enterprise: z.object({
				price: z.union([z.number(), z.string()]),
				features: z.array(z.string()),
			}),
		}),
		competitor: z.object({
			starter: z.object({
				price: z.union([z.number(), z.string()]),
				features: z.array(z.string()),
			}),
			pro: z.object({
				price: z.union([z.number(), z.string()]),
				features: z.array(z.string()),
			}),
			enterprise: z.object({
				price: z.union([z.number(), z.string()]),
				features: z.array(z.string()),
			}),
		}),
	}),
	useCases: z.array(
		z.object({
			title: z.string(),
			nvisy: z.string(),
			competitor: z.string(),
		}),
	),
});

export type ComparisonItem = z.infer<typeof comparisonSchema>;
const comparisons = defineCollection({
	type: "data",
	schema: comparisonSchema,
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

const customerSchema = z.object({
	title: z.string(),
	company: z.string(),
	logo: z.string(),
	industry: z.string(),
	excerpt: z.string(),
	metrics: z.array(
		z.object({
			label: z.string(),
			value: z.string(),
		}),
	),
	publishedAt: z.coerce.date(),
	updatedAt: z.coerce.date().optional(),
});

export type CustomerItem = z.infer<typeof customerSchema>;
const customers = defineCollection({
	type: "content",
	schema: customerSchema,
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

export const collections = {
	blog,
	legal,
	jobs,
	roadmap,
	comparisons,
	integrations,
	faqs,
	customers,
	testimonials,
};
