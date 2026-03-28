export interface ScoringLabels {
  authenticity: {
    labelMatch: string;
    matrixNumber: string;
    typography: string;
    serialRange: string;
  };
  condition: {
    surface: string;
    sleeve: string;
    label: string;
    edges: string;
  };
}

const scoringLabels: Record<string, ScoringLabels> = {
  VINYL: {
    authenticity: {
      labelMatch: "Label Match",
      matrixNumber: "Matrix Number",
      typography: "Typography",
      serialRange: "Serial Range",
    },
    condition: {
      surface: "Vinyl Surface",
      sleeve: "Sleeve/Cover",
      label: "Label Condition",
      edges: "Edges/Corners",
    },
  },
  CD: {
    authenticity: {
      labelMatch: "Disc Print Match",
      matrixNumber: "Catalog Number",
      typography: "Typography",
      serialRange: "Barcode/IFPI",
    },
    condition: {
      surface: "Disc Surface",
      sleeve: "Jewel Case",
      label: "Print/Label",
      edges: "Hinges/Spine",
    },
  },
  CASSETTE: {
    authenticity: {
      labelMatch: "Shell Print Match",
      matrixNumber: "Catalog Number",
      typography: "Typography",
      serialRange: "Barcode Match",
    },
    condition: {
      surface: "Tape/Shell",
      sleeve: "Case/Inlay",
      label: "Label/Inlay Card",
      edges: "Edges/Shell",
    },
  },
  MERCH: {
    authenticity: {
      labelMatch: "Branding Match",
      matrixNumber: "Tag Verification",
      typography: "Typography",
      serialRange: "Hologram/Tags",
    },
    condition: {
      surface: "Fabric/Material",
      sleeve: "Packaging",
      label: "Print/Graphics",
      edges: "Stitching/Seams",
    },
  },
  EQUIPMENT: {
    authenticity: {
      labelMatch: "Brand Markings",
      matrixNumber: "Serial Number",
      typography: "Typography",
      serialRange: "Model Verification",
    },
    condition: {
      surface: "Housing/Body",
      sleeve: "Packaging",
      label: "Controls/Panels",
      edges: "Connectors/Ports",
    },
  },
};

export function getScoringLabels(type: string): ScoringLabels {
  return scoringLabels[type] ?? scoringLabels.VINYL!;
}
