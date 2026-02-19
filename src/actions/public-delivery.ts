"use server"

import { getPathaoCities, getPathaoZones, getPathaoAreas } from "@/lib/delivery/external-apis";

// Wrapper for public access (no admin check)
export async function getPublicCities() { return await getPathaoCities(); }
export async function getPublicZones(cityId: number) { return await getPathaoZones(cityId); }
export async function getPublicAreas(zoneId: number) { return await getPathaoAreas(zoneId); }

export async function verifyPathaoLocation(district: string, city: string) {
  try {
    const cities = await getPathaoCities();
    if (!cities || cities.length === 0) return { matched: false };

    const cleanDistrict = district.trim().toLowerCase();
    const cleanCity = city.trim().toLowerCase();
    
    let match: any = null;

    // 1. Kathmandu Valley Check
    if (['kathmandu', 'lalitpur', 'bhaktapur'].includes(cleanDistrict) || 
        ['kathmandu', 'lalitpur', 'bhaktapur'].includes(cleanCity)) {
        match = cities.find((c: any) => c.city_name === "Kathmandu Valley");
    }

    // 2. Direct Match
    if (!match) {
        match = cities.find((c: any) => 
            c.city_name.toLowerCase() === cleanCity || 
            c.city_name.toLowerCase() === cleanDistrict
        );
    }

    // 3. Partial Match
    if (!match) {
        match = cities.find((c: any) => 
            c.city_name.toLowerCase().includes(cleanCity) || 
            c.city_name.toLowerCase().includes(cleanDistrict)
        );
    }

    if (match) {
      return { 
        matched: true, 
        cityId: match.city_id, 
        cityName: match.city_name 
      };
    }

    return { matched: false };
  } catch (error) {
    console.error("Location Verify Error:", error);
    return { matched: false };
  }
}