import { z } from 'zod'

export const dogPolicySchema = z.enum(['allowed', 'conditional', 'disallowed', 'unknown'])

export const submissionNewPlaceSchema = z.object({
  type: z.literal('new_place'),
  submitted_name: z.string().min(2).max(200),
  submitted_category: z.string().optional(),
  submitted_commune: z.string().optional(),
  submitted_url: z.string().url().optional().or(z.literal('')),
  submitted_dog_policy: dogPolicySchema.optional(),
  submitted_conditions_text: z.string().max(500).optional(),
  submitted_message: z.string().max(1000).optional(),
  submitter_email: z.string().email().optional().or(z.literal('')),
})

export const submissionCorrectionSchema = z.object({
  type: z.literal('correction'),
  related_place_id: z.string().uuid(),
  submitted_dog_policy: dogPolicySchema.optional(),
  submitted_conditions_text: z.string().max(500).optional(),
  submitted_message: z.string().max(1000).optional(),
  submitter_email: z.string().email().optional().or(z.literal('')),
  submitted_url: z.string().url().optional().or(z.literal('')),
})

export const submissionSchema = z.discriminatedUnion('type', [
  submissionNewPlaceSchema,
  submissionCorrectionSchema,
])

export const placeCreateSchema = z.object({
  name: z.string().min(2).max(200),
  category_id: z.number().int().positive().optional(),
  short_description: z.string().max(300).optional(),
  editorial_summary: z.string().max(1000).optional(),
  dog_policy: dogPolicySchema,
  dog_conditions_text: z.string().max(500).optional(),
  address_text: z.string().max(300).optional(),
  commune_id: z.number().int().positive().optional(),
  postal_code: z.string().max(10).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
  website_url: z.string().url().optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  email_public: z.string().email().optional().or(z.literal('')),
  opening_hours_text: z.string().max(300).optional(),
  price_level: z.number().int().min(1).max(4).optional(),
  cover_image_url: z.string().url().nullable().optional(),
})

export const placeUpdateSchema = placeCreateSchema.partial()

export const sourceCreateSchema = z.object({
  place_id: z.string().uuid(),
  source_type: z.enum([
    'manual', 'official_website', 'google_places', 'osm',
    'user_submission', 'phone_call', 'onsite_check',
    'partner_feed', 'social_page', 'booking_site',
  ]),
  source_url: z.string().url().optional().or(z.literal('')),
  source_label: z.string().max(200).optional(),
  raw_excerpt: z.string().max(2000).optional(),
  claim_dog_policy: dogPolicySchema.optional(),
  claim_conditions_text: z.string().max(500).optional(),
  is_primary: z.boolean().default(false),
  published_or_seen_at: z.string().datetime().optional(),
})

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})
