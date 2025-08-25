"use client";

import { useEffect, useState } from "react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { Card } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
import { formatInTimeZone } from "date-fns-tz"
import { Separator } from "./ui/separator";
import { CustomStatusType } from "@/utils/storage";

interface TrackingHistory {
  date: string;
  time: string;
  location: string;
  status: string;
}

interface TrackingData {
  trackingNumber: string;
  courier: string;
  shippingDate: string;
  lastUpdate: string;
  status: CustomStatusType;
  transitTime: string;
  route: string;
  weight: string;
  history: TrackingHistory[];
}

const groupTrackingByDate = (data: TrackingData[]) => {
  return data.reduce<Record<string, TrackingData[]>>((acc, item) => {
    (acc[item.shippingDate] = acc[item.shippingDate] || []).push(item);
    return acc;
  }, {});
};

const groupHistoryByDate = (history: TrackingHistory[]) => {
  return history.reduce<Record<string, TrackingHistory[]>>((acc, event) => {
    (acc[event.date] = acc[event.date] || []).push(event);
    return acc;
  }, {});
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "Delivered":
      return "bg-green-200 text-green-800";
    case "In Transit":
      return "bg-yellow-200 text-yellow-800";
    case "Out for Delivery":
      return "bg-blue-200 text-blue-800";
    case "Pending":
      return "bg-gray-200 text-gray-800";
    default:
      return "bg-gray-300 text-gray-900";
  }
};

export default function TrackingAccordion() {
  const [trackingData, setTrackingData] = useState<TrackingData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrackingData = async () => {
      try {
        const response = await fetch("/api/fedex-tracking");
        const data = await response.json();
        setTrackingData(data);
      } catch (error) {
        console.error("Error fetching tracking data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrackingData();
  }, []);

  if (loading) {
    return <div>Loading...</div>;
  }

  const groupedTracking = groupTrackingByDate(trackingData);

  return (
    <div className="space-y-6 text-black">
      {Object.entries(groupedTracking).map(([date, shipments]) => (
        <div key={date}>
          <h2 className="text-xl font-bold bg-gray-200 px-4 py-4 rounded-md">
            📆 {format(parseISO(date), "dd MMM yyyy")}
          </h2>

          <Accordion type="single" collapsible>
            {shipments.map((tracking) => {
              const groupedHistory = groupHistoryByDate(tracking.history);

              return (
                <AccordionItem key={tracking.trackingNumber} className="my-2" value={tracking.trackingNumber}>
                  <AccordionTrigger className="bg-gray-100 px-4 rounded-xl">
                    <div className="flex flex-col w-full text-left">
                      <strong>📦 Tracking Number: {tracking.trackingNumber}</strong>
                      <Separator className="mt-3" />
                      <table className="w-full mt-2 text-xs">
                        <tbody>
                          <tr>
                            <td className="align-top w-1/2 pr-4 text-left">
                              <p>Courier: {tracking.courier}</p>
                              <p>Shipping Date: {formatInTimeZone(tracking.shippingDate, 'America/New_York', "dd MMM yyyy HH:mm")}</p>
                              <p>Last Update: {formatInTimeZone(tracking.lastUpdate, 'America/New_York', "dd MMM yyyy HH:mm")}</p>
                              <p>Transit Time: {tracking.transitTime}</p>
                            </td>
                            <td className="align-top w-1/2 pl-4 text-left">
                              <p>Route: {tracking.route}</p>
                              <p>Weight: {tracking.weight}</p>
                              <p>Status: {tracking.status.name}</p>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Card className="p-4 border border-gray-300 shadow-sm bg-gray-100 text-black">
                      <div className="mt-4">
                        <h3 className="font-semibold text-lg">Travel History</h3>
                        <div className="border-l border-gray-300 pl-4 mt-2 space-y-4">
                          {Object.entries(groupedHistory).map(([date, events]) => (
                            <div key={date}>
                              <p className="font-semibold">{formatInTimeZone(date, 'America/New_York', "dd MMM yyyy")}</p>
                              <ul>
                                {events.map((event, index) => (
                                  <li key={index} className="mb-2 flex flex-col gap-[2px]">
                                    <p><strong>Status : {event.status}</strong></p>
                                    <p className="text-xs">{event.time}</p>
                                    <p className="text-xs text-gray-500">{event.location}</p>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          ))}
                        </div>
                      </div>
                    </Card>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        </div>
      ))}
    </div>
  );
}
