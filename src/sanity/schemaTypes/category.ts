import {defineField, defineType} from 'sanity'

export const category = defineType({
  name: 'category',
  title: 'Category',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
    }),
    defineField({
      name: 'tier',
      title: 'Primary Tier',
      type: 'string',
      options: {
        list: [
          {title: 'Enterprise', value: 'enterprise'},
          {title: 'SMB', value: 'smb'},
          {title: 'Set-Aside', value: 'set-aside'},
        ],
      },
    }),
  ],
})
