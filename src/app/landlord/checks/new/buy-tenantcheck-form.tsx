"use client";

import { useState } from "react";
import { buyTenantcheck } from "@/app/landlord/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Property = { id: string; label: string; address_line1: string };

const NEW_PROPERTY = "__new__";

export function BuyTenantcheckForm({
  properties,
  preselectedPropertyId,
}: {
  properties: Property[];
  preselectedPropertyId?: string;
}) {
  const initial =
    preselectedPropertyId && properties.some((p) => p.id === preselectedPropertyId)
      ? preselectedPropertyId
      : NEW_PROPERTY;

  const [selectedProperty, setSelectedProperty] = useState(initial);
  const isNewProperty = selectedProperty === NEW_PROPERTY;

  return (
    <form action={buyTenantcheck} className="mt-6 flex flex-col gap-8">
      <fieldset className="flex flex-col gap-4">
        <legend className="text-sm font-medium text-slate-900">Tenant details</legend>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tenant_full_name">Tenant full name</Label>
          <Input id="tenant_full_name" name="tenant_full_name" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tenant_email">Tenant email</Label>
          <Input id="tenant_email" name="tenant_email" type="email" required />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="tenant_phone">Tenant phone (optional)</Label>
          <Input id="tenant_phone" name="tenant_phone" type="tel" />
        </div>
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="text-sm font-medium text-slate-900">Property details</legend>

        {properties.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="existing_property_id">Property</Label>
            <select
              id="existing_property_id"
              name="existing_property_id"
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm"
            >
              <option value={NEW_PROPERTY}>+ Add a new property</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} — {p.address_line1}
                </option>
              ))}
            </select>
          </div>
        )}

        {isNewProperty && (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="address_line1">Address line 1</Label>
              <Input
                id="address_line1"
                name="address_line1"
                placeholder="e.g. 12 Oak Ave, Unit 4"
                required={isNewProperty}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="address_line2">Address line 2 (optional)</Label>
              <Input id="address_line2" name="address_line2" />
            </div>
            <div className="flex gap-4">
              <div className="flex w-1/2 flex-col gap-1.5">
                <Label htmlFor="city">City</Label>
                <Input id="city" name="city" />
              </div>
              <div className="flex w-1/2 flex-col gap-1.5">
                <Label htmlFor="province">Province</Label>
                <Input id="province" name="province" />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="postal_code">Postal code</Label>
              <Input id="postal_code" name="postal_code" />
            </div>
          </div>
        )}
      </fieldset>

      <Button type="submit" size="lg" className="w-full">
        Buy Tenantcheck — R350.00
      </Button>
    </form>
  );
}
