# Sample Data for 3Dmol.js Power BI Visual

This file contains sample protein structure data that can be used to test the 3Dmol.js Power BI custom visual.

## Using Sample Data in Power BI

1. Create a new table in Power BI with a text column
2. Copy one of the sample structures below
3. Paste it into a cell in your data table
4. Use this field with the 3Dmol Protein Viewer visual

## Sample 1: Small Peptide (PDB Format)

```
ATOM      1  N   MET A   1       0.000   0.000   0.000  1.00  0.00           N  
ATOM      2  CA  MET A   1       1.458   0.000   0.000  1.00  0.00           C  
ATOM      3  C   MET A   1       2.009   1.420   0.000  1.00  0.00           C  
ATOM      4  O   MET A   1       1.251   2.390   0.000  1.00  0.00           O  
ATOM      5  CB  MET A   1       1.989  -0.744   1.232  1.00  0.00           C  
ATOM      6  CG  MET A   1       1.515  -2.192   1.281  1.00  0.00           C  
ATOM      7  SD  MET A   1       2.172  -3.069   2.707  1.00  0.00           S  
ATOM      8  CE  MET A   1       1.355  -4.660   2.486  1.00  0.00           C  
```

## Sample 2: Alpha Helix (PDB Format)

```
ATOM      1  N   ALA A   1      -8.901   4.127  -0.555  1.00  0.00           N
ATOM      2  CA  ALA A   1      -8.608   3.135  -1.618  1.00  0.00           C
ATOM      3  C   ALA A   1      -7.117   2.964  -1.897  1.00  0.00           C
ATOM      4  O   ALA A   1      -6.634   1.849  -1.758  1.00  0.00           O
ATOM      5  CB  ALA A   1      -9.437   3.396  -2.889  1.00  0.00           C
ATOM      6  N   GLU A   2      -6.379   4.025  -2.228  1.00  0.00           N
ATOM      7  CA  GLU A   2      -4.923   4.003  -2.478  1.00  0.00           C
ATOM      8  C   GLU A   2      -4.197   3.533  -1.227  1.00  0.00           C
ATOM      9  O   GLU A   2      -4.661   3.769  -0.112  1.00  0.00           O
ATOM     10  CB  GLU A   2      -4.490   5.385  -2.957  1.00  0.00           C
ATOM     11  CG  GLU A   2      -5.027   5.779  -4.322  1.00  0.00           C
ATOM     12  CD  GLU A   2      -4.554   7.147  -4.765  1.00  0.00           C
ATOM     13  OE1 GLU A   2      -3.356   7.330  -5.089  1.00  0.00           O
ATOM     14  OE2 GLU A   2      -5.383   8.086  -4.791  1.00  0.00           O
```

## Obtaining Real Protein Data

You can download real protein structures from:

1. **RCSB Protein Data Bank (PDB)**: https://www.rcsb.org/
   - Search for a protein (e.g., "1CRN" for Crambin)
   - Download the structure in PDB or mmCIF format
   - Copy the contents into your Power BI data

2. **AlphaFold Database**: https://alphafold.ebi.ac.uk/
   - Search for proteins by UniProt ID
   - Download predicted structures in PDB format

3. **Example using PowerQuery** to fetch from RCSB:
   ```
   let
       Source = Web.Contents("https://files.rcsb.org/download/1CRN.pdb"),
       ConvertedText = Text.FromBinary(Source)
   in
       ConvertedText
   ```

## Sample PDB IDs to Try

- **1CRN**: Small protein, good for testing (Crambin)
- **1UBQ**: Ubiquitin, a common regulatory protein
- **2LYZ**: Lysozyme, an enzyme
- **1MBN**: Myoglobin, oxygen-binding protein
- **3HFM**: Villin headpiece, small fast-folding protein

## Tips

- Larger structures (>5000 atoms) may take longer to render
- Use "Medium" or "Low" rendering quality for large structures
- The "Cartoon" style works best for visualizing protein secondary structure
- Use "Stick" or "Line" styles for smaller molecules or detailed atomic views
