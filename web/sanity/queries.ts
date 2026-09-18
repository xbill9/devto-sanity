// Every tally is a GROQ count() computed by the Content Lake — never summed in React.
export const FIELDS_QUERY: string = `
  *[_type == "field"] | order(number asc) {
    _id, number, name, crop, irrigation, growth,
    "water": count(*[_type == "vote" && field._ref == ^._id && choice == "water"]),
    "brawndo": count(*[_type == "vote" && field._ref == ^._id && choice == "brawndo"])
  }
`

// The docket: each Joe's Plan instance, joined to its proposal. The subject is a GDR URI,
// dataset:<project>:<dataset>:<documentId>, so the document id is its fourth segment.
export const DOCKET_QUERY: string = `
  *[_type == "sanity.workflow.instance" && tag == $workflowTag && !defined(abortedAt)] | order(startedAt desc) [0...10] {
    _id, currentStage, startedAt,
    "harvestAt": fields[name == "harvestAt"][0].value,
    "proposal": *[_id == string::split(^.fields[name == "subject"][0].value.id, ":")[3]][0]{
      title, author, "fields": fields[]->number
    }
  }
`

export const TOTALS_QUERY: string = `{
  "votes": count(*[_type == "vote"]),
  "citizens": count(*[_type == "citizen"]),
  "watered": count(*[_type == "field" && irrigation == "water"]),
  "fields": count(*[_type == "field"])
}`

export const MY_VOTES_QUERY: string = `*[_type == "vote" && citizen._ref == $citizen]{"field": field._ref, choice}`
