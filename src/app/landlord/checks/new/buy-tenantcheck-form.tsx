"use client";

import { useState } from "react";
import { buyTenantcheck } from "@/app/landlord/actions";

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
      : properties.length > 0
        ? NEW_PROPERTY
        : NEW_PROPERTY;

  const [selectedProperty, setSelectedProperty] = useState(initial);
  const isNewProperty = selectedProperty === NEW_PROPERTY;

  return (
    <form action={buyTenantcheck} className="mt-6 flex flex-col gap-8">
      <fieldset className="flex flex-col gap-4">
        <legend className="text-sm font-medium">Tenant details</legend>
        <input
          name="tenant_full_name"
          className="rounded border px-3 py-2"
          placeholder="Tenant full name"
          required
        />
        <input
          name="tenant_email"
          type="email"
          className="rounded border px-3 py-2"
          placeholder="Tenant email"
          required
        />
        <input
          name="tenant_phone"
          className="rounded border px-3 py-2"
          placeholder="Tenant phone (optional)"
        />
      </fieldset>

      <fieldset className="flex flex-col gap-4">
        <legend className="text-sm font-medium">Property details</legend>

        {properties.length > 0 && (
          <label className="flex flex-col gap-1 text-sm">
            Property
            <select
              name="existing_property_id"
              value={selectedProperty}
              onChange={(e) => setSelectedProperty(e.target.value)}
              className="rounded border px-3 py-2"
            >
              <option value={NEW_PROPERTY}>+ Add a new property</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} — {p.address_line1}
                </option>
              ))}
            </select>
          </label>
        )}

        {isNewProperty && (
          <div className="flex flex-col gap-4">
            <input
              name="label"
              className="rounded border px-3 py-2"
              placeholder="Label (e.g. 12 Oak Ave, Unit 4)"
              required={isNewProperty}
            />
            <input
              name="address_line1"
              className="rounded border px-3 py-2"
              placeholder="Address line 1"
              required={isNewProperty}
            />
            <input
              name="address_line2"
              className="rounded border px-3 py-2"
              placeholder="Address line 2 (optional)"
            />
            <div className="flex gap-4">
              <input
                name="city"
                className="w-1/2 rounded border px-3 py-2"
                placeholder="City"
              />
              <input
                name="province"
                className="w-1/2 rounded border px-3 py-2"
                placeholder="Province"
              />
            </div>
            <input
              name="postal_code"
              className="rounded border px-3 py-2"
              placeholder="Postal code"
            />
          </div>
        )}
      </fieldset>

      <button type="submit" className="rounded bg-black px-3 py-2 text-white">
        Buy Tenantcheck — R350.00
      </button>
    </form>
  );
}
