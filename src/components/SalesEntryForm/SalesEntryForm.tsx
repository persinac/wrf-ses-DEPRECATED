import {faLongArrowAltDown, faLongArrowAltUp} from '@fortawesome/free-solid-svg-icons';
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome';
import * as React from "react";
import Accordion from 'react-bootstrap/Accordion';
import Card from 'react-bootstrap/Card';
import {CabinetsValidationError, ProductDetails, Questions} from '../../State';
import {ErrorWrapper} from "../ErrorWrapper/ErrorWrapper";
import {CabinetMapper} from "../../Mapper/CabinetMapper";

const ShortNames = ['total_length',
'total_depth',
'total_height',
'cab_quantity',
'cab_fl',
'cab_fw',
'cab_sl',
'cab_sw',
'cab_bl',
'cab_bw',
'cab_mt',
'paint' ,
'doors_mt'];


interface InterfaceProps {
	users?: any;
	some_data?: any;
	category_id?: number;
	category_title?: string;
	all_categories?: any;
	questions?: Questions[];
	productDetails: ProductDetails[];
	cabinetErrors?: CabinetsValidationError;
}

interface IState {
	doesContainShow?: boolean;
	productDetails?: ProductDetails[];
	currentQuestionIdx?: number;
}

export class SalesEntryForm extends React.Component<InterfaceProps, IState> {
	constructor(props: any) {
		super(props);

		this.state = {
			doesContainShow: false,
			currentQuestionIdx: 0,
			productDetails: this.props.productDetails
		};
	}

	private handleAccordionToggleClick(e: any, aId: string) {
		const el = document.getElementById(aId);
		el.classList.toggle('show');
		if (el && el.classList.contains('show')) {
			this.setState({doesContainShow: true});
		} else {
			this.setState({doesContainShow: false});
		}
	}

	componentDidMount(): void {
		const currCategory = this.props.all_categories.filter((f: any) => f.category_id === this.props.category_id);
		const element = document.getElementById(`parent-question-${currCategory[0].category_id}`);
		if (element.childElementCount > 1) {
			element.classList.add('sales-form-card-overflow-height-300');
		} else {
			element.classList.add('sales-form-card-overflow-height-auto');
		}
	}

	shouldComponentUpdate(nextProps: InterfaceProps, nextState: IState) {
		let didToggle = this.state.doesContainShow !== nextState.doesContainShow;

		const shouldRerender: boolean = !didToggle;
		return shouldRerender;
	}

	private createNewRow(questions: any) {
		return (
			<div className={'row'}>
				{questions}
			</div>
		);
	}

	private buildHeader(category: string) {
		return (<h5>{category}</h5>);
	}

	private injectGroupingInput(question: any, classyMcClasserson: string) {
		let idx = -1;
		this.state.productDetails.some((pd: ProductDetails, internal_i: number) => {
			if (pd.q_fk == question.q_id) {
				idx = internal_i;
				return true;
			}
			return false;
		});
		return (
			<div className={classyMcClasserson}>
				<label htmlFor={question['short_name']}>{question['text']}</label>
				<input
					id={question['short_name']}
					value={this.state.productDetails[idx].response}
					onChange={(event: any) => this.setDynStateWithEvent(event, question['q_id'], question['short_name'])}
					type='text'
					placeholder={question['tooltip']}
					className='form-control'
				/>
				{this.attachError(Number(question['cat_fk']), question['short_name'])}
			</div>
		);
	}

	private attachError(category_id: number, short_name: string) {
		switch (category_id) {
			case 10:
				return (<ErrorWrapper errorMessage={CabinetMapper.mapErrorObject(short_name, this.props.cabinetErrors)} id={short_name}/>);
			default:
				return null;
		}
	}

	private recursivelyBuildQuestions(currCategory: any, groupedInputs?: any) {
		const maxQsPerRow = 2;
		const classyClass = `col-md-${12/maxQsPerRow} mb-3`;
		if(currCategory) {
			// for each category
			let groupedSubCatInputs = currCategory.map((sc: any) => {
				// - grab the questions that correspond to that category
				let filteredQs: any = this.props.questions.filter((filter: any) => filter.cat_fk === sc.category_id);

				// - construct a header
				const header = sc.category_hierarchy > 1 ? this.buildHeader(sc.category) : null;

				// unique groups will be built via the questions.grouping
				const uniqueGroups: number[] = Array.from(new Set(filteredQs.map((item: any) => item.grouping)));

				let divRowQuestionsByGrouping = uniqueGroups.map((groupNum: number) => {
					// for each unique grouping
					//  - get questions that are in the current grouping
					let groupFilteredQs: any = filteredQs.filter((filter: any) => filter.grouping === groupNum);

					//  - construct the questions inputs
					const builtQuestions = groupFilteredQs.map((q: any) => {
						return this.injectGroupingInput(q, classyClass);
					});
					return ( this.createNewRow(builtQuestions) );
				});
				let subCats: any = this.props.all_categories.filter((filter: any) => filter.belongs_to === sc.category_id);
				if (subCats.length > 0) {
					return this.recursivelyBuildQuestions(subCats, divRowQuestionsByGrouping);
				} else {
					let concatInputs;
					if (groupedInputs !== undefined) {
						concatInputs = groupedInputs.concat(header, divRowQuestionsByGrouping);
					} else {
						concatInputs = divRowQuestionsByGrouping;
					}
					if (concatInputs.length > 0) {
						return (
							<div>
								{concatInputs}
							</div>
						)
					}
				}
			});
			return [].concat.apply([], groupedSubCatInputs);
		}
	}

	private questionBuilder() {
		if (this.props.questions) {
			const currCategory = this.props.all_categories.filter((f: any) => f.category_id === this.props.category_id);
			return (
				<div id={`parent-question-${currCategory[0].category_id}`} >
					{this.recursivelyBuildQuestions(currCategory)}
				</div>
			);
		}
	}

	public render() {
		const {questions, category_id}: any = this.props;
		if (category_id && questions) {
			return this.renderCard(questions);
		} else {
			return null;
		}
	}

	private renderCard(questions: Questions[]) {
		return (
			<Card>
				<Accordion.Toggle as={Card.Header} eventKey={this.props.category_id.toString()}
				                  onClick={(e) => this.handleAccordionToggleClick(e, `accord-${this.props.category_id.toString()}`)}>
					{this.props.category_title}
					{/* TODO: not working properly due to state should update */
						/*<span className={'floater-rght'} id={'accord-icon-0'}>
						{
							this.state.doesContainShow ?
								<FontAwesomeIcon icon={faLongArrowAltUp}/> :
								<FontAwesomeIcon icon={faLongArrowAltDown}/>
						}
					</span>*/}
				</Accordion.Toggle>
				<Accordion.Collapse eventKey={this.props.category_id.toString()}
				                    id={`accord-${this.props.category_id.toString()}`}>
					<Card.Body className={'nopadding'}>
						{!!questions && this.questionBuilder()}
					</Card.Body>
				</Accordion.Collapse>
			</Card>
		);
	}

	private static propKey(propertyName: string, value: any): object {
		return {[propertyName]: value};
	}

	private setStateWithEvent(event: any, columnType: string): void {
		this.setState(SalesEntryForm.propKey(columnType, (event.target as any).value));
	}

	private setDynStateWithEvent(event: any, index: number, columnType: string): void {
		this.setState({
			productDetails: this.onUpdateItem(index, columnType, (event.target as any).value)
		});
	}

	private onUpdateItem = (i: number, propName: string, value: any) => {
		let myList = this.state.productDetails;
		let idx = -1;
		this.state.productDetails.some((pd: ProductDetails, internal_i: number) => {
			if (pd.q_fk == i) {
				idx = internal_i;
				return true;
			}
			return false;
		});
		let pdItem: ProductDetails = this.state.productDetails[idx];
		pdItem.response = value;
		myList[idx] = pdItem;
		return myList;
	}
}
