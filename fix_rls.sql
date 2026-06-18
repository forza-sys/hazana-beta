CREATE POLICY "Super Admin Full Access Master Lembaga" 
ON master_lembaga
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'SUPER_ADMIN'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'SUPER_ADMIN'
    )
);
