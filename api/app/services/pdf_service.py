# api/app/services/pdf_service.py
from fpdf import FPDF
from datetime import date
from typing import Dict, Any, List

def format_currency(value: float) -> str:
    """Formata um valor float para moeda BRL."""
    return f"R$ {value:,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")

class PDFReport(FPDF):
    def header(self):
        # Logo (opcional - ajuste o caminho se tiver um logo)
        # self.image('path/to/your/logo.png', 10, 8, 33)
        self.set_font('Helvetica', 'B', 15)
        self.cell(0, 10, 'VR Sales - Relatório', 0, 1, 'C')
        self.ln(5) # Quebra de linha

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.cell(0, 10, f'Página {self.page_no()}', 0, 0, 'C')

    def chapter_title(self, title):
        self.set_font('Helvetica', 'B', 12)
        self.cell(0, 10, title, 0, 1, 'L')
        self.ln(4)

    def chapter_body(self, content):
        self.set_font('Helvetica', '', 10)
        self.multi_cell(0, 5, content)
        self.ln()

    def add_summary_table(self, data: Dict[str, Any], start_date: date, end_date: date):
        self.set_font('Helvetica', '', 10)
        period_str = f"Período: {start_date.strftime('%d/%m/%Y')} a {end_date.strftime('%d/%m/%Y')}"
        self.cell(0, 6, period_str, 0, 1)
        self.ln(2)

        col_width = self.w / 3.5 # Largura aproximada das colunas
        line_height = 8

        headers = ["Indicador", "Valor"]
        data_rows = [
            ("Receita Total", format_currency(data.get('total_sales_amount', 0.0))),
            ("Número de Vendas", str(data.get('number_of_transactions', 0))),
            ("Ticket Médio", format_currency(data.get('average_ticket', 0.0))),
        ]

        # Cabeçalho da Tabela
        self.set_font('Helvetica', 'B', 10)
        self.set_fill_color(230, 230, 230) # Cinza claro
        self.cell(col_width * 1.5, line_height, headers[0], 1, 0, 'L', True)
        self.cell(col_width, line_height, headers[1], 1, 1, 'R', True)

        # Dados da Tabela
        self.set_font('Helvetica', '', 10)
        fill = False
        for row in data_rows:
            self.set_fill_color(245, 245, 245) if fill else self.set_fill_color(255, 255, 255)
            self.cell(col_width * 1.5, line_height, row[0], 'LR', 0, 'L', fill)
            self.cell(col_width, line_height, row[1], 'LR', 1, 'R', fill)
            fill = not fill
        # Linha inferior da tabela
        self.cell(col_width * 2.5, 0, '', 'T', 1)


# Função principal para gerar o PDF de Vendas por Período
def generate_sales_by_period_pdf(data: Dict[str, Any], start_date: date, end_date: date) -> bytes:
    """
    Gera o conteúdo binário de um PDF para o relatório de vendas por período.
    """
    pdf = PDFReport(orientation='P', unit='mm', format='A4')
    pdf.add_page()
    pdf.set_auto_page_break(auto=True, margin=15)

    pdf.chapter_title(f"Relatório de Vendas - {start_date.strftime('%d/%m/%Y')} a {end_date.strftime('%d/%m/%Y')}")

    pdf.add_summary_table(data, start_date, end_date)

    # Adicionar mais seções ou tabelas se necessário

    pdf_output = pdf.output(dest='S') # 'S' retorna o PDF como bytes
    return pdf_output