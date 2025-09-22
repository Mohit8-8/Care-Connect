"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Check, Star } from "lucide-react";

const Pricing = () => {
  const pricingPlans = [
    {
      name: "Basic Consultation",
      price: "$29",
      duration: "30 minutes",
      features: [
        "General health consultation",
        "Prescription if needed",
        "Follow-up recommendations",
        "Medical report",
      ],
      popular: false,
    },
    {
      name: "Extended Consultation",
      price: "$49",
      duration: "45 minutes",
      features: [
        "Comprehensive health assessment",
        "Detailed diagnosis",
        "Treatment plan",
        "Prescription medications",
        "Medical report",
        "Priority scheduling",
      ],
      popular: true,
    },
    {
      name: "Specialist Consultation",
      price: "$79",
      duration: "60 minutes",
      features: [
        "Specialist doctor consultation",
        "Advanced diagnostic review",
        "Specialized treatment plan",
        "Prescription medications",
        "Detailed medical report",
        "Follow-up care coordination",
        "Priority support",
      ],
      popular: false,
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
      {pricingPlans.map((plan, index) => (
        <Card
          key={index}
          className={`relative border-emerald-900/30 shadow-lg bg-gradient-to-b from-emerald-950/30 to-transparent ${
            plan.popular ? "ring-2 ring-emerald-500/50" : ""
          }`}
        >
          {plan.popular && (
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-emerald-500 text-white px-3 py-1">
                <Star className="h-3 w-3 mr-1" />
                Most Popular
              </Badge>
            </div>
          )}

          <CardHeader className="text-center pb-4">
            <CardTitle className="text-xl font-bold text-white mb-2">
              {plan.name}
            </CardTitle>
            <div className="text-center">
              <span className="text-3xl font-bold text-emerald-400">
                {plan.price}
              </span>
              <span className="text-muted-foreground ml-1">/{plan.duration}</span>
            </div>
          </CardHeader>

          <CardContent className="pt-0">
            <ul className="space-y-3 mb-6">
              {plan.features.map((feature, featureIndex) => (
                <li key={featureIndex} className="flex items-center text-sm">
                  <Check className="h-4 w-4 text-emerald-400 mr-3 flex-shrink-0" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>

            <Button
              className={`w-full ${
                plan.popular
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-emerald-900/50 hover:bg-emerald-900/70"
              }`}
              variant={plan.popular ? "default" : "outline"}
            >
              Book Consultation
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

export default Pricing;