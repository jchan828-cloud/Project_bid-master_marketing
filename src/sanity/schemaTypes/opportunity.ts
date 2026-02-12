import {defineField, defineType} from 'sanity'

export const opportunity = defineType({
  name: 'opportunity',
  title: 'Opportunity Teaser',
  type: 'document',
  fields: [
    defineField({
      name: 'externalId',
      title: 'SAM.gov Notice ID',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
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
      name: 'agency',
      title: 'Agency',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'type',
      title: 'Type',
      type: 'string',
      options: {
        list: ['RFP', 'RFI', 'Sources Sought', 'Award'],
      },
    }),
    defineField({
      name: 'dueDate',
      title: 'Due Date',
      type: 'datetime',
    }),
    defineField({
      name: 'estimatedValue',
      title: 'Estimated Value',
      type: 'object',
      fields: [
        {name: 'min', type: 'number', title: 'Minimum'},
        {name: 'max', type: 'number', title: 'Maximum'},
        {name: 'currency', type: 'string', title: 'Currency', options: {list: ['USD', 'CAD']}},
      ],
    }),
    defineField({
      name: 'naicsCode',
      title: 'NAICS Code',
      type: 'string',
    }),
    defineField({
      name: 'setAsideType',
      title: 'Set-Aside Type',
      type: 'string',
      options: {
        list: ['8(a)', 'WOSB', 'SDVOSB', 'HUBZone', 'Small Business', 'Full & Open'],
      },
    }),
    defineField({
      name: 'summary',
      title: 'AI Summary',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'tier',
      title: 'Target Tier',
      type: 'string',
      options: {
        list: ['enterprise', 'smb', 'set-aside'],
      },
    }),
    defineField({
      name: 'sourceUrl',
      title: 'SAM.gov URL',
      type: 'url',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      agency: 'agency',
      type: 'type',
    },
    prepare({title, agency, type}) {
      return {
        title,
        subtitle: `${type} | ${agency}`,
      }
    },
  },
})
