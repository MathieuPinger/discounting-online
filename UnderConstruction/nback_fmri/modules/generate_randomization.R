library(jsonlite)

# Define parameters
n_subjects <- 80
subject_ids <- paste0("dpd_", 1:n_subjects)
rando_hitbutton_values <- c("b", "g")
rando_tasks_values <- c("0back", "2back")

# Create all combinations of rando_hitbutton and rando_tasks
combinations <- expand.grid(rando_hitbutton = rando_hitbutton_values, 
                            rando_tasks = rando_tasks_values)

# Repeat combinations to match the number of subjects (ensure balance)
rep_combinations <- combinations[rep(seq_len(nrow(combinations)), length.out = n_subjects), ]

# Randomize order of combinations
set.seed(42) # Set seed for reproducibility
randomized_combinations <- rep_combinations[sample(nrow(rep_combinations)), ]

# Create the final data frame
output_data <- data.frame(
  subject_id = subject_ids,
  rando_hitbutton = randomized_combinations$rando_hitbutton,
  rando_tasks = randomized_combinations$rando_tasks
)

# Convert to JSON format
output_json <- toJSON(output_data, pretty = TRUE)

# Write to a file
write(output_json, file = "rando_nback.json")

# Print confirmation
cat("JSON file successfully created as 'output.json'\n")
