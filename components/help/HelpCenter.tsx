"use client"

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card } from "@/components/ui/card"

const faqItems = [
  {
    question: "How do I track a new package?",
    answer:
      "To track a new package, go to the main dashboard or tracking page. Enter the FedEx tracking number in the input field, select the appropriate status, and click 'Log'. You can also capture images of the package by clicking the 'Capture Images' button.",
  },
  {
    question: "How can I edit a tracking entry?",
    answer:
      "You can edit a tracking entry by finding it in the tracking list and using the action buttons on the right side. You can modify the status, add images, or remove the entry if needed.",
  },
  {
    question: "What do I do if I encounter a duplicate tracking number?",
    answer:
      "If you enter a tracking number that already exists in the system, you'll receive a warning message. You can either cancel the entry or choose to override it by clicking 'Override and Add Anyway'.",
  },
  {
    question: "How do I generate reports?",
    answer:
      "Navigate to the Reports page from the sidebar. You can select a date range, view various charts and statistics, and download reports in CSV format using the 'Download Report' button.",
  },
  {
    question: "How do I manage team members?",
    answer:
      "Go to the Team Management page. Here you can add new team members, edit existing ones, and manage their roles and permissions. Use the filters to find specific team members quickly.",
  },
]

export function HelpCenter() {
  return (
    <Card className="p-6">
      <Accordion type="single" collapsible className="w-full">
        {faqItems.map((item, index) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left">{item.question}</AccordionTrigger>
            <AccordionContent>{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Card>
  )
}

