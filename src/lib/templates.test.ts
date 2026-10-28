import { describe, expect, test } from "bun:test";
import { ADP_OPTIONS, FRANJAS_INFO, SGA_TEMPLATES, WSP_TEMPLATES, adpSignature, renderTemplate, renderWsp } from "./templates";
import { EXAMPLE_TICKET, parseTicket } from "./ticket-parser";

describe("ADP signatures", () => {
  for (const [name, signature] of [
    ["Jesus Cerna", "I.C"], ["Jeferson Bautista", "J.B"],
    ["Angelo Palomino", "A.P"], ["Antony Bernaloa", "A.B"], ["Paul Carrasco", "P.C"],
    ["Lee Mauricio", "L.M."], ["Carlos Chiroque", "C.C."],
  ] as const) {
    test(`${name} uses the requested SGA and WhatsApp signatures`, () => {
      expect(ADP_OPTIONS).toContain(name);
      expect(adpSignature(name)).toBe(signature);
      const sga = SGA_TEMPLATES.find(t => t.id === "confirma-visita");
      const wsp = WSP_TEMPLATES.find(t => t.id === "ruta");
      if (!sga || !wsp) throw new Error("Missing templates");
      expect(renderTemplate(sga, { ADP: name })).toContain(`REALIZADO POR: ${name}`);
      expect(renderWsp(wsp, { FIRMA: adpSignature(name) }).endsWith(signature)).toBe(true);
    });
  }
  test("legacy uppercase Lee Mauricio keeps the WhatsApp signature", () => {
    expect(adpSignature("LEE MAURICIO")).toBe("L.M.");
  });
  test("Angie Mori is selectable and signs WhatsApp A.M", () => {
    expect(ADP_OPTIONS).toContain("Angie Mori");
    expect(adpSignature("Angie Mori")).toBe("A.M");
  });
  test("Xiavier Capa is selectable and signs WhatsApp X.C", () => {
    expect(ADP_OPTIONS).toContain("Xiavier Capa");
    expect(adpSignature("Xiavier Capa")).toBe("X.C");
    const sga = SGA_TEMPLATES.find(t => t.id === "confirma-visita");
    if (!sga) throw new Error("Missing confirmation template");
    expect(renderTemplate(sga, { ADP: "Xiavier Capa" })).toContain("REALIZADO POR: Xiavier Capa");
  });
  test("SGA uses Angie Mori's full name", () => {
    const tpl = SGA_TEMPLATES.find(t => t.id === "confirma-visita");
    if (!tpl) throw new Error("Missing confirmation template");
    expect(renderTemplate(tpl, { ADP: "Angie Mori" })).toContain("REALIZADO POR: Angie Mori");
  });
});

test("Coverage requested WhatsApp message uses the SOT and the selected advisor signature", () => {
  const tpl = WSP_TEMPLATES.find(t => t.id === "cobertura");
  if (!tpl) throw new Error("Missing coverage requested template");
  expect(renderWsp(tpl, { SOT: "88459734", FIRMA: adpSignature("Carlos Chiroque") }))
    .toBe("@ Estimado. SOT: 88459734 se encuentra en proceso de gestión. C.C.");
  expect(renderWsp(tpl, { SOT: "99887766", FIRMA: adpSignature("Lee Mauricio") }))
    .toBe("@ Estimado. SOT: 99887766 se encuentra en proceso de gestión. L.M.");
});

test("Los 5 rechazos interpolates the SOT and active WhatsApp signature", () => {
  const tpl = WSP_TEMPLATES.find(t => t.id === "los-5-rechazos");
  if (!tpl) throw new Error("Missing coverage rejection template");
  const result = renderWsp(tpl, { SOT: "91835706", FIRMA: adpSignature("Angie Mori") });
  expect(result).toContain("SOT:91835706 fue rechazada");
  expect(result.endsWith("A.M")).toBe(true);
});

test("Habilitación uses the same TOA plano as Fuera de TOA", () => {
  const ticket = parseTicket(EXAMPLE_TICKET);
  expect(ticket.plano).toBe("0TCNA016-S");
  for (const id of ["habilitacion-franjas", "fuera-toa"]) {
    const tpl = SGA_TEMPLATES.find(t => t.id === id);
    if (!tpl) throw new Error(`Missing template ${id}`);
    expect(renderTemplate(tpl, { PLANO: ticket.plano })).toContain("🪚 PLANO: 0TCNA016-S");
    expect(renderTemplate(tpl, {})).toContain("🪚 PLANO: \n");
  }
});

describe("Supported visit slots", () => {
  for (const [value, label, start, end] of [
    ["AM0", "AM0 · 07:00 – 09:00", "07:00", "08:59"],
    ["AM1", "AM1 · 09:00 – 13:00", "09:00", "12:59"],
    ["PM1", "PM1 · 14:00 – 18:00", "14:00", "17:59"],
    ["PM3", "PM3 · 18:00 – 20:00", "18:00", "19:59"],
  ] as const) {
    test(`${value} covers the requested time interval`, () => {
      expect(FRANJAS_INFO.find(f => f.value === value)?.label).toBe(label);
      expect(parseTicket(`Franja: ${value}`).franja).toBe(value);
      expect(parseTicket(`Hora: ${start}`).franja).toBe(value);
      expect(parseTicket(`Hora: ${end}`).franja).toBe(value);
    });
  }
  test("Only the four requested slots are available", () => {
    expect(FRANJAS_INFO.map(f => f.value)).toEqual(["AM0", "AM1", "PM1", "PM3"]);
    for (const hour of ["06:59", "13:00", "20:00"]) expect(parseTicket(`Hora: ${hour}`).franja).toBe("");
  });
});