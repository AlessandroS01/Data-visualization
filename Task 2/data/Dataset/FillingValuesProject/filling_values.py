import pandas as pd

df = pd.read_csv(r"C:\Users\Lenovo\Desktop\University\Master University\Passau University\Studies\Sommersemester 2025\Data Visualization\Uebung\Project\Task 2\data\Dataset\dataToUse.csv", encoding='latin1')


df = df.sort_values(by=["Name", "Year"])

cols_to_interp = ["GiniC", "GR", "LifeExpectacyB", "GDP"]

def interp_with_prev_only(group):
    for col in cols_to_interp:
        first_valid_idx = group[col].first_valid_index()
        if first_valid_idx is not None:
            mask_before_first = group.index < first_valid_idx
            group.loc[mask_before_first, col] = pd.NA
            group[col] = group[col].interpolate(method='linear')
    return group

df = df.groupby("Name").apply(interp_with_prev_only)

# After groupby apply, index can be messed up, so reset index if needed:
df = df.reset_index(drop=True)

# Sort again by Name and Year before saving
df = df.sort_values(by=["Name", "Year"])

df.to_csv("filledDataReduced.csv", index=False)

print(df)





